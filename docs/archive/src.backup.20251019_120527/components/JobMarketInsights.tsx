
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, TrendingUp, Briefcase } from 'lucide-react';

interface JobMarketData {
  current_demand: string;
  salary_range: string;
  growth_outlook: string;
  locations: string[];
  job_postings: Array<{
    title: string;
    company: string;
    location: string;
    salary?: string;
    posted_date: string;
  }>;
}

interface JobMarketInsightsProps {
  data: JobMarketData | null;
  isLoading: boolean;
}

export function JobMarketInsights({ data, isLoading }: JobMarketInsightsProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Job Market Intelligence</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Job Market Intelligence</h3>
        </div>
        <p className="text-gray-600">Job market data temporarily unavailable.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Job Market Intelligence</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Current Demand</p>
              <p className="font-medium">{data.current_demand}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Salary Range</p>
              <p className="font-medium">{data.salary_range}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Growth Outlook</p>
            <Badge variant="outline" className="text-green-700 border-green-200">
              {data.growth_outlook}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Top Locations</p>
            <div className="flex flex-wrap gap-2">
              {data.locations.slice(0, 3).map((location, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {data.job_postings && data.job_postings.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Recent Job Postings</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.job_postings.slice(0, 5).map((job, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-gray-600">{job.company}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </div>
                  <div className="text-right">
                    {job.salary && (
                      <p className="text-xs font-medium text-green-600">{job.salary}</p>
                    )}
                    <p className="text-xs text-gray-400">{job.posted_date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
