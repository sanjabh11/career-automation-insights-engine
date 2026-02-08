
import React, { useEffect, useState } from 'react';
import { Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  errorRate: number;
  userActions: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    errorRate: 0,
    userActions: 0
  });

  useEffect(() => {
    const collectMetrics = () => {
      // Page load performance
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;

      // Memory usage (if available)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

      // API response times
      const resourceEntries = performance.getEntriesByType('resource');
      const apiCalls = resourceEntries.filter(entry => 
        entry.name.includes('/functions/') || entry.name.includes('supabase')
      );
      const avgApiTime = apiCalls.length > 0 
        ? apiCalls.reduce((sum, entry) => sum + entry.duration, 0) / apiCalls.length 
        : 0;

      setMetrics({
        pageLoadTime: Math.round(pageLoadTime),
        apiResponseTime: Math.round(avgApiTime),
        memoryUsage: Math.round(memoryUsage),
        errorRate: 0, // This would be tracked separately
        userActions: parseInt(localStorage.getItem('userActionCount') || '0')
      });
    };

    // Collect initial metrics
    collectMetrics();

    // Update metrics periodically
    const interval = setInterval(collectMetrics, 30000);

    // Track user actions
    const trackAction = () => {
      const count = parseInt(localStorage.getItem('userActionCount') || '0') + 1;
      localStorage.setItem('userActionCount', count.toString());
    };

    document.addEventListener('click', trackAction);
    document.addEventListener('keydown', trackAction);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', trackAction);
      document.removeEventListener('keydown', trackAction);
    };
  }, []);

  const getPerformanceStatus = (metric: string, value: number) => {
    const thresholds = {
      pageLoadTime: { good: 2000, poor: 4000 },
      apiResponseTime: { good: 1000, poor: 3000 },
      memoryUsage: { good: 50, poor: 100 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'default';

    if (value <= threshold.good) return 'default';
    if (value <= threshold.poor) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Page Load</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{metrics.pageLoadTime}ms</p>
                <Badge variant={getPerformanceStatus('pageLoadTime', metrics.pageLoadTime)}>
                  {metrics.pageLoadTime < 2000 ? 'Good' : metrics.pageLoadTime < 4000 ? 'Fair' : 'Poor'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">API Response</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{metrics.apiResponseTime}ms</p>
                <Badge variant={getPerformanceStatus('apiResponseTime', metrics.apiResponseTime)}>
                  {metrics.apiResponseTime < 1000 ? 'Good' : metrics.apiResponseTime < 3000 ? 'Fair' : 'Poor'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Memory Usage</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{metrics.memoryUsage}MB</p>
                <Badge variant={getPerformanceStatus('memoryUsage', metrics.memoryUsage)}>
                  {metrics.memoryUsage < 50 ? 'Good' : metrics.memoryUsage < 100 ? 'Fair' : 'High'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">User Actions</p>
              <p className="text-lg font-bold">{metrics.userActions}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Metrics updated every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}
