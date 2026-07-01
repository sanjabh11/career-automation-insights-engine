import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

export interface OverviewTabProps {
  riskData: { name: string; value: number; color: string }[];
  riskDistributionSummary: string;
  departmentChartData: { department: string; avg_apo_score: number }[];
  departmentRiskSummary: string;
}

export function OverviewTab({
  riskData,
  riskDistributionSummary,
  departmentChartData,
  departmentRiskSummary,
}: OverviewTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Employee distribution by automation risk level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="sr-only">
            Risk distribution chart summary: {riskDistributionSummary}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart accessibilityLayer={false}>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                rootTabIndex={-1}
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Risk Levels</CardTitle>
          <CardDescription>
            Average APO score by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="sr-only">
            Department risk chart summary: {departmentRiskSummary}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avg_apo_score" fill="#8b5cf6" name="Avg APO Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
