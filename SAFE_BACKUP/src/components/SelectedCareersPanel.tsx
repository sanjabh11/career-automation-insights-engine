
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SelectedCareersPanelProps {
  selectedJobs: any[];
  calculateOverallAPO: (occ: any) => number;
  handleRemoveSelected: (code: string) => void;
}

export function SelectedCareersPanel({
  selectedJobs,
  calculateOverallAPO,
  handleRemoveSelected,
}: SelectedCareersPanelProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Selected Careers ({selectedJobs.length})
      </h3>
      <div className="space-y-3">
        {selectedJobs.map((job) => {
          const overallAPO = calculateOverallAPO(job);
          const riskLevel = overallAPO >= 70 ? 'High' : overallAPO >= 50 ? 'Med-High' : overallAPO >= 30 ? 'Medium' : 'Low';
          const riskColor = overallAPO >= 70 ? 'text-red-600' : overallAPO >= 50 ? 'text-orange-600' : overallAPO >= 30 ? 'text-yellow-600' : 'text-green-600';

          return (
            <div key={job.code} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">
                    {overallAPO.toFixed(1)}%
                  </p>
                  <p className={`text-xs font-medium ${riskColor}`}>
                    {riskLevel} Risk
                  </p>
                </div>
              </div>
              {job.timeline && (
                <Badge className="text-xs bg-blue-50 text-blue-700">
                  {job.timeline}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
