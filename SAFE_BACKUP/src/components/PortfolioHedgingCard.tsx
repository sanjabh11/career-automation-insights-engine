import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Weight { skill: string; weight: number }

export function PortfolioHedgingCard({
  weights,
  onApply,
}: {
  weights: Weight[];
  onApply: (next: Weight[]) => void;
}) {
  if (!Array.isArray(weights) || weights.length < 2) return null;

  const sorted = [...weights].sort((a,b)=>b.weight-a.weight);
  const top = sorted[0];
  const bottom = sorted[sorted.length-1];
  const concentration = Math.round(top.weight * 1000) / 10; // % with 0.1 precision

  const shift = 0.05; // 5% suggested shift
  const canShift = top.weight - shift >= 0 && bottom.weight + shift <= 1;

  const suggestion: Weight[] = weights.map(w => {
    if (!canShift) return w;
    if (w.skill === top.skill) return { ...w, weight: Math.max(0, w.weight - shift) };
    if (w.skill === bottom.skill) return { ...w, weight: Math.min(1, w.weight + shift) };
    return w;
  });

  const fmt = (x:number)=>`${(x*100).toFixed(1)}%`;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-semibold text-slate-800">Concentration & Hedging</h5>
        <Badge className={concentration >= 60 ? 'bg-red-100 text-red-700' : concentration >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
          Concentration Risk: {concentration}%
        </Badge>
      </div>
      <div className="text-xs text-slate-600 mb-3">
        Top holding <span className="font-medium">{top.skill}</span> at {fmt(top.weight)}. Consider shifting {fmt(shift)} to <span className="font-medium">{bottom.skill}</span> to hedge.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="p-2 rounded border">
          <div className="text-[11px] text-slate-500 mb-1">Current Weights</div>
          <div className="space-y-1">
            {sorted.map(w=> (
              <div key={w.skill} className="flex justify-between">
                <span>{w.skill}</span>
                <span>{fmt(w.weight)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-2 rounded border">
          <div className="text-[11px] text-slate-500 mb-1">After Hedge (suggested)</div>
          <div className="space-y-1">
            {suggestion.sort((a,b)=>b.weight-a.weight).map(w=> (
              <div key={w.skill} className="flex justify-between">
                <span>{w.skill}</span>
                <span>{fmt(w.weight)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Button size="sm" onClick={()=>onApply(suggestion)} disabled={!canShift}>Apply recommendations</Button>
      </div>
    </Card>
  );
}
