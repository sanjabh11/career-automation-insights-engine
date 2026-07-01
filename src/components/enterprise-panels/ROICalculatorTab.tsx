import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw, TrendingUp } from 'lucide-react';

export interface RoiResult {
  totalInvestment?: number;
  projectedSavings?: number;
  roiPercentage?: number | string;
  analysis?: string;
}

export interface RoiParams {
  employeeCount: number;
  avgSalary: number;
  trainingCost: number;
}

export interface ROICalculatorTabProps {
  roiParams: RoiParams;
  setRoiParams: React.Dispatch<React.SetStateAction<RoiParams>>;
  calculateROI: () => void;
  roiLoading: boolean;
  roiResult: RoiResult | null;
}

export function ROICalculatorTab({
  roiParams, setRoiParams, calculateROI, roiLoading, roiResult,
}: ROICalculatorTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning ROI Calculator</CardTitle>
        <CardDescription>
          Calculate the potential return on investment for employee reskilling programs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Number of Employees to Reskill</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={roiParams.employeeCount}
                onChange={(e) => setRoiParams({ ...roiParams, employeeCount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Average Annual Salary ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={roiParams.avgSalary}
                onChange={(e) => setRoiParams({ ...roiParams, avgSalary: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Training Cost per Employee ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={roiParams.trainingCost}
                onChange={(e) => setRoiParams({ ...roiParams, trainingCost: Number(e.target.value) })}
              />
            </div>
            <Button onClick={calculateROI} disabled={roiLoading} className="w-full">
              {roiLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Calculate ROI
            </Button>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Projected ROI Analysis</h3>
            {roiResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded border">
                  <span className="text-sm text-muted-foreground">Total Investment</span>
                  <span className="font-bold">${roiResult.totalInvestment?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded border">
                  <span className="text-sm text-muted-foreground">Projected Savings (1 Year)</span>
                  <span className="font-bold text-green-600">${roiResult.projectedSavings?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded border">
                  <span className="text-sm text-muted-foreground">ROI Percentage</span>
                  <span className="font-bold text-[var(--accent-primary)]">{roiResult.roiPercentage}%</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{roiResult.analysis}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                <p>Enter parameters and click Calculate to see ROI projections.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
