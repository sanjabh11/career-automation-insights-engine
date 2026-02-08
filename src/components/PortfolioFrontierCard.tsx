import React from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface FrontierProps {
  items: Array<{ skill: string; expected: string; risk: string }>;
  correlation: number;
  baseline: { expected: number; risk: number };
  optimized: Array<{ skill: string; weight: number }>;
}

export function PortfolioFrontierCard({ items, correlation, baseline, optimized }: FrontierProps) {
  const data = React.useMemo(() => {
    if (!baseline) return null;
    const curr = { name: 'Current', risk: baseline.risk * 100, ret: baseline.expected * 100 };
    // Heuristic points for stub
    const optRisk = Math.max(0, baseline.risk * 0.9);
    const optRet = baseline.expected * 1.05;
    const lowRisk = Math.max(0, baseline.risk * 0.8);
    const lowRet = baseline.expected * 0.95;
    return [
      { name: 'Low risk', risk: Math.round(lowRisk * 1000) / 10, ret: Math.round(lowRet * 1000) / 10 },
      { name: 'Current', risk: Math.round(curr.risk * 10) / 10, ret: Math.round(curr.ret * 10) / 10 },
      { name: 'Optimized', risk: Math.round(optRisk * 1000) / 10, ret: Math.round(optRet * 1000) / 10 },
    ];
  }, [baseline]);

  if (!data) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-semibold text-slate-800">Efficient Frontier (stub)</h5>
        <div className="text-[10px] text-slate-500">ρ={correlation}</div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Risk (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(v:number)=>`${v.toFixed(1)}%`} />
            <Line type="monotone" dataKey="risk" stroke="#94a3b8" strokeWidth={2} dot />
            <Line type="monotone" dataKey="ret" stroke="#0ea5e9" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-slate-500 mt-2">Stub for demo: shows current vs heuristic low-risk vs optimized points.</div>
    </Card>
  );
}
