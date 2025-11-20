
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';

interface StatsOverviewProps {
  selectedJobsCount: number;
}

export const StatsOverview = ({ selectedJobsCount }: StatsOverviewProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });

  const stats = [
    {
      title: 'Total Occupations',
      value: '1,016+',
      description: 'O*NET database coverage',
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50',
      trend: '+12 this month',
      trendPositive: true,
    },
    {
      title: 'Analyzed Today',
      value: '247',
      description: 'APO calculations performed',
      icon: Users,
      color: 'text-green-600 bg-green-50',
      trend: '+24 from yesterday',
      trendPositive: true,
    },
    {
      title: 'Active Sessions',
      value: '1,542',
      description: 'Career planning sessions',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
      trend: '+18% this week',
      trendPositive: true,
    },
    {
      title: 'Latest Update',
      value: currentDate,
      description: 'Data last refreshed',
      icon: Calendar,
      color: 'text-orange-600 bg-orange-50',
      trend: 'Live Data',
      trendPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 min-h-[140px] hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mb-2">{stat.description}</p>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs ${stat.trendPositive ? 'text-green-600' : 'text-gray-600'}`}>
                  {stat.trendPositive && <TrendingUp className="w-3 h-3" />}
                  <span className="font-medium">{stat.trend}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
