
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface APOVisualizationProps {
  categories: Array<{
    name: string;
    apo: number;
    data: Array<{ description: string; apo: number }>;
  }>;
}

export const APOVisualization = ({ categories }: APOVisualizationProps) => {
  const getColor = (apo: number) => {
    if (apo >= 70) return '#dc2626'; // red-600
    if (apo >= 50) return '#d97706'; // yellow-600
    return '#16a34a'; // green-600
  };

  const chartData = categories.map(category => ({
    name: category.name,
    apo: category.apo,
    color: getColor(category.apo)
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'APO (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'APO']}
            labelFormatter={(label) => `${label} Category`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar dataKey="apo" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
