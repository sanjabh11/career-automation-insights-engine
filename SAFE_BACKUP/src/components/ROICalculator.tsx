import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface ROIShape {
  roi_months?: number;
  annual_wage?: number; // proxy current annual wage
  avg_cost?: number;    // proxy investment cost
  industry_sector?: string;
}

export function ROICalculator({ roi }: { roi: ROIShape }) {
  const months = typeof roi?.roi_months === 'number' ? Math.max(1, Math.min(60, Math.round(roi.roi_months))) : null;
  const invest = typeof roi?.avg_cost === 'number' ? Math.max(0, roi.avg_cost) : null;

  // Simple synthetic breakeven curve when we don't have full series from backend
  // Assumption: linear monthly benefit that crosses 0 at roi_months
  const data = React.useMemo(() => {
    if (!months || !invest) return null;
    const monthlyGain = invest / months; // ensures 0 at month = roi_months
    const arr: { month: number; cumulative: number }[] = [];
    let cum = -invest;
    for (let m = 0; m <= 60; m++) {
      if (m > 0) cum += monthlyGain;
      arr.push({ month: m, cumulative: Math.round(cum) });
    }
    return arr;
  }, [months, invest]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">ROI Calculator</h3>
        {roi?.industry_sector && (
          <Badge variant="outline" className="text-[10px]">Sector: {roi.industry_sector}</Badge>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded border p-3">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600" /><span className="text-xs text-gray-600">Investment</span></div>
          <div className="text-lg font-semibold">{invest != null ? `$${Math.round(invest).toLocaleString()}` : '—'}</div>
          <div className="text-[11px] text-gray-500">Courses + misc. costs</div>
        </div>
        <div className="rounded border p-3">
          <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-blue-600" /><span className="text-xs text-gray-600">Payback</span></div>
          <div className="text-lg font-semibold">{months != null ? `${months} months` : '—'}</div>
          <div className="text-[11px] text-gray-500">Breakeven timeline</div>
        </div>
        <div className="rounded border p-3">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-purple-600" /><span className="text-xs text-gray-600">Annual Wage (est.)</span></div>
          <div className="text-lg font-semibold">{typeof roi?.annual_wage === 'number' ? `$${Math.round(roi.annual_wage).toLocaleString()}` : '—'}</div>
          <div className="text-[11px] text-gray-500">For current occupation</div>
        </div>
      </div>

      {data ? (
        <div className="bg-white rounded border p-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Cumulative impact (simplified)</div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v)=>`$${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v:number)=>`$${Math.round(v).toLocaleString()}`} labelFormatter={(m)=>`Month ${m}`} />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="cumulative" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {months != null && (
            <div className="text-[11px] text-gray-500 mt-2">Crosses breakeven around month {months}. Synthetic chart when detailed plan data is unavailable.</div>
          )}
        </div>
      ) : (
        <div className="text-[12px] text-gray-600">Detailed breakeven chart unavailable. Missing either investment or payback months.</div>
      )}
    </Card>
  );
}
