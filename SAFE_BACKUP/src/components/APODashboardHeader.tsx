
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, BarChart3 } from "lucide-react";

interface APODashboardHeaderProps {
  selectedJobsCount: number;
  onExport: () => void;
}

export function APODashboardHeader({ selectedJobsCount, onExport }: APODashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Occupation Explorer</h1>
            <div className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Enhanced AI v2.0
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={selectedJobsCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedJobsCount})
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
