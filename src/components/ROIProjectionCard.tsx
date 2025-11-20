import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LearningPathData {
  financials: {
    totalCost: number;
    salaryIncrease: number;
    roiMonths: number | null;
  };
}

interface ROIProjectionCardProps {
  learningPathData: LearningPathData;
}

export function ROIProjectionCard({ learningPathData }: ROIProjectionCardProps) {
  const projections = useMemo(() => {
    const { totalCost, salaryIncrease } = learningPathData.financials;
    const monthlySalaryIncrease = salaryIncrease / 12;
    const monthlyCostAmortization = totalCost / 60; // Assume 60 months to amortize

    const data = [];
    let cumulativeNet = 0;
    let breakEvenMonth = null;

    for (let month = 1; month <= 60; month++) {
      const netBenefit = monthlySalaryIncrease - monthlyCostAmortization;
      cumulativeNet += netBenefit;

      if (breakEvenMonth === null && cumulativeNet >= 0) {
        breakEvenMonth = month;
      }

      data.push({
        month,
        netBenefit: Math.round(netBenefit * 100) / 100,
        cumulativeNet: Math.round(cumulativeNet * 100) / 100,
      });
    }

    return { data, breakEvenMonth };
  }, [learningPathData.financials]);

  const exportCSV = () => {
    const csv = [
      ['Month', 'Monthly Net Benefit', 'Cumulative Net Benefit'],
      ...projections.data.map(d => [d.month, d.netBenefit, d.cumulativeNet])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roi_projections.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const breakEvenMonth = projections.breakEvenMonth;
  const finalCumulative = projections.data[projections.data.length - 1]?.cumulativeNet || 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          ROI Projections (5 Years)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-sm">Break-even</h4>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {breakEvenMonth ? `${breakEvenMonth} mo` : 'Not reached'}
              </p>
            </Card>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-sm">5-Year Net Benefit</h4>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                ${finalCumulative.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-sm">Monthly Average</h4>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                ${((finalCumulative / 60) || 0).toFixed(0)}/mo
              </p>
            </Card>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projections.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Net Benefit ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    name === 'cumulativeNet' ? 'Cumulative Net' : 'Monthly Net'
                  ]}
                  labelFormatter={(month) => `Month ${month}`}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeNet"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="cumulativeNet"
                />
                <Line
                  type="monotone"
                  dataKey="netBenefit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="netBenefit"
                  strokeDasharray="5 5"
                />
                {breakEvenMonth && (
                  <ReferenceLine
                    x={breakEvenMonth}
                    stroke="#ef4444"
                    strokeWidth={2}
                    label={{
                      value: "Break-even",
                      position: "topRight",
                      fill: "#ef4444"
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Export */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span>Cumulative Net Benefit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500 border-dashed border-t-2"></div>
                <span>Monthly Net Benefit</span>
              </div>
            </div>
            <Button onClick={exportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Notes */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="mb-1"><strong>Assumptions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Training costs amortized over 5 years</li>
              <li>Salary increase applied immediately</li>
              <li>No inflation or interest rate adjustments</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
