
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

export const TopCareersPanel = () => {
  const topCareers = [
    { title: 'Software Developers', apo: 25.4, trend: 'low', category: 'Technology' },
    { title: 'Registered Nurses', apo: 32.1, trend: 'low', category: 'Healthcare' },
    { title: 'Financial Analysts', apo: 68.2, trend: 'high', category: 'Finance' },
    { title: 'Data Scientists', apo: 28.9, trend: 'low', category: 'Technology' },
    { title: 'Marketing Managers', apo: 45.7, trend: 'medium', category: 'Business' },
  ];

  const getAPOColor = (apo: number) => {
    if (apo >= 60) return 'text-red-600';
    if (apo >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'high' ? 
      <TrendingUp className="h-4 w-4 text-red-500" /> : 
      <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Award className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Top Careers</h3>
      </div>
      
      <div className="space-y-3">
        {topCareers.map((career, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm text-gray-900">{career.title}</h4>
              {getTrendIcon(career.trend)}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {career.category}
              </Badge>
              <span className={`text-sm font-semibold ${getAPOColor(career.apo)}`}>
                {career.apo}% APO
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Updated weekly based on latest automation research and job market trends
        </p>
      </div>
    </Card>
  );
};
