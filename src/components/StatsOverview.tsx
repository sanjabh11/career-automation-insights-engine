
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, BookOpen, TrendingUp, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsOverviewProps {
  selectedJobsCount: number;
}

export const StatsOverview = ({ selectedJobsCount }: StatsOverviewProps) => {
  const stats = [
    {
      title: 'O*NET Occupations',
      value: '1,016+',
      description: 'O*NET 29.3 database',
      icon: Database,
      iconColor: 'text-[var(--accent-primary)]',
      iconBg: 'bg-[var(--accent-primary)]/10',
      source: 'O*NET 29.3',
    },
    {
      title: 'Net New Jobs by 2030',
      value: '78M',
      description: '170M created vs 92M displaced',
      icon: TrendingUp,
      iconColor: 'text-[var(--accent-amber)]',
      iconBg: 'bg-[var(--accent-amber)]/10',
      source: 'WEF Future of Jobs 2025',
    },
    {
      title: 'Work Hours Automatable',
      value: '57%',
      description: 'via human-AI partnerships',
      icon: BarChart3,
      iconColor: 'text-[var(--accent-info)]',
      iconBg: 'bg-[var(--accent-info)]/10',
      source: 'McKinsey 2025',
    },
    {
      title: 'Workers Needing Reskill',
      value: '59%',
      description: 'of global workforce by 2030',
      icon: BookOpen,
      iconColor: 'text-[var(--accent-success)]',
      iconBg: 'bg-[var(--accent-success)]/10',
      source: 'WEF Future of Jobs 2025',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
        >
          <Card className={`p-5 min-h-[130px] card-interactive border-[hsl(var(--border))] bg-[var(--bg-secondary)] ${
            index === 0 ? 'ring-1 ring-[var(--accent-primary)]/10' : ''
          }`}>
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5" style={{ fontFamily: 'var(--font-mono)' }}>{stat.value}</p>
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-0.5">{stat.title}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{stat.description}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Source: {stat.source}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
