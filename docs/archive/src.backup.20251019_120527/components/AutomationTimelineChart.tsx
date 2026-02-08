
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

interface TimelineData {
  category: string;
  years: number;
  confidence: number;
  impact: 'Low' | 'Medium' | 'High';
}

interface AutomationTimelineChartProps {
  data: TimelineData[];
  occupationTitle: string;
}

export function AutomationTimelineChart({ data, occupationTitle }: AutomationTimelineChartProps) {
  const getBarColor = (impact: string) => {
    switch (impact) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'years') {
      return [`${value} years`, 'Estimated Timeline'];
    }
    return [value, name];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Automation Timeline Forecast</h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Predicted automation timeline for <span className="font-medium">{occupationTitle}</span> by category
        </p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Years', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => `Category: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="years" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.impact)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Impact</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Impact</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Key Insights</span>
        </div>
        <p className="text-xs text-blue-700">
          Categories with shorter timelines (2-5 years) are more likely to be automated soon. 
          Focus on developing skills in areas with longer timelines (10+ years) for career sustainability.
        </p>
      </div>
    </Card>
  );
}
