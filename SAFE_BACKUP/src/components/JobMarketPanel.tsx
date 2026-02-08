
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobMarketData {
  totalJobs: number;
  averageSalary?: number;
  salaryRange?: {
    min: number;
    max: number;
  };
  topLocations: Array<{
    location: string;
    count: number;
  }>;
  recentJobs: Array<{
    title: string;
    company: string;
    location: string;
    salary?: string;
    postedDate: string;
    source: string;
  }>;
  trending: boolean;
  error?: string;
}

interface JobMarketPanelProps {
  jobTitle: string;
}

export function JobMarketPanel({ jobTitle }: JobMarketPanelProps) {
  const [jobData, setJobData] = useState<JobMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchJobMarketData = async () => {
    if (!jobTitle) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching job market data for:', jobTitle);
      
      const { data, error } = await supabase.functions.invoke('serpapi-jobs', {
        body: { jobTitle },
      });

      if (error) {
        console.error('Job market data error:', error);
        throw new Error(`Job market analysis failed: ${error.message}`);
      }

      console.log('Job market data received:', data);
      setJobData(data);

      if (data.error) {
        toast({
          variant: 'destructive',
          title: 'Job Market Data Warning',
          description: data.error,
        });
      } else {
        toast({
          title: 'Job Market Data Updated',
          description: `Found ${data.totalJobs} active job listings`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch job market data:', error);
      toast({
        variant: 'destructive',
        title: 'Job Market Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to fetch job market data',
      });
      setJobData({
        totalJobs: 0,
        recentJobs: [],
        topLocations: [],
        trending: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobTitle) {
      fetchJobMarketData();
    }
  }, [jobTitle]);

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  if (!jobTitle) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select an occupation to view job market data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Job Market Analysis</h3>
          {jobData?.trending && (
            <Badge className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchJobMarketData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing job market...</p>
        </div>
      ) : jobData ? (
        <div className="space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{jobData.totalJobs}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {jobData.averageSalary ? formatSalary(jobData.averageSalary) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg Salary</div>
            </div>
          </div>

          {/* Salary Range */}
          {jobData.salaryRange && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Salary Range</span>
              </div>
              <div className="text-sm text-gray-600">
                {formatSalary(jobData.salaryRange.min)} - {formatSalary(jobData.salaryRange.max)}
              </div>
            </div>
          )}

          {/* Top Locations */}
          {jobData.topLocations.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Top Locations</span>
              </div>
              <div className="space-y-2">
                {jobData.topLocations.map((location, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{location.location}</span>
                    <span className="text-gray-500">{location.count} jobs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          {jobData.recentJobs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Listings</h4>
              <div className="space-y-3">
                {jobData.recentJobs.map((job, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="font-medium text-sm text-gray-900 mb-1">{job.title}</div>
                    <div className="text-xs text-gray-600">{job.company}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{job.location}</span>
                      {job.salary && (
                        <span className="text-xs text-green-600 font-medium">{job.salary}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{job.postedDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {jobData.error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Limited data available</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Unable to load job market data</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchJobMarketData}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
}
