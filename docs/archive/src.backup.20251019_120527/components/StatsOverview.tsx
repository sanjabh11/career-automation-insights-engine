
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Database } from 'lucide-react';

interface StatsOverviewProps {
  selectedJobsCount: number;
}

export const StatsOverview = ({ selectedJobsCount }: StatsOverviewProps) => {
  const stats = [
    {
      title: 'Total Occupations',
      value: '1,016+',
      description: 'O*NET database coverage',
      icon: Database,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Analyzed Today',
      value: '247',
      description: 'APO calculations performed',
      icon: BarChart3,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'Active Users',
      value: '1,542',
      description: 'Career planning sessions',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Your Selection',
      value: selectedJobsCount.toString(),
      description: 'Careers in your list',
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
