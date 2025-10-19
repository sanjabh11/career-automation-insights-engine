import React from 'react';
import { Activity, Database, Server, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  cache_entries: number;
  version: string;
  error?: string;
}

export function SystemHealthMonitor() {
  const { data: healthStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['system_health'],
    queryFn: async (): Promise<HealthStatus> => {
      const { data, error } = await supabase.rpc('health_check');
      if (error) throw error;
      
      // Type assertion for the response data - cast to unknown first, then to HealthStatus
      return data as unknown as HealthStatus;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Checking system status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Health Check Failed</p>
              <p className="text-sm text-red-600">{error.message}</p>
            </div>
          </div>
        ) : healthStatus ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthStatus.status)}
                <span className="font-medium">Overall Status</span>
              </div>
              {getStatusBadge(healthStatus.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-gray-600">{healthStatus.database}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Server className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Cache Entries</p>
                  <p className="text-xs text-gray-600">{healthStatus.cache_entries}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-xs text-gray-600">{healthStatus.version}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
            </div>

            {healthStatus.error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Error Details:</p>
                <p className="text-sm text-red-600">{healthStatus.error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">No health data available</div>
        )}
      </CardContent>
    </Card>
  );
}
