import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function CareerSimulatorCard({ currentSalary, targetSalary }: { currentSalary?: number; targetSalary?: number }) {
  const [hours, setHours] = React.useState<number>(10);
  const [risk, setRisk] = React.useState<"conservative"|"balanced"|"aggressive">("balanced");
  const [iterations, setIterations] = React.useState<number>(2000);
  const [duration, setDuration] = React.useState<number>(36);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('simulate-career-trajectory', {
        body: {
          hours_per_week: hours,
          risk_tolerance: risk,
          duration_months_max: duration,
          iterations,
          current_salary: typeof currentSalary === 'number' ? currentSalary : undefined,
          target_salary: typeof targetSalary === 'number' ? targetSalary : undefined,
        }
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Career Trajectory Simulator</h3>
        <div className="text-[10px] text-gray-500">Monte Carlo-lite</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div>
          <label className="text-xs text-gray-600">Hours/week</label>
          <Input type="number" value={hours} min={1} max={60} onChange={e=>setHours(Math.max(1, Math.min(60, Number(e.target.value)||10)))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Risk tolerance</label>
          <select className="w-full border rounded h-9 text-sm" value={risk} onChange={e=>setRisk(e.target.value as any)}>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Iterations</label>
          <Input type="number" value={iterations} min={200} max={20000} onChange={e=>setIterations(Math.max(200, Math.min(20000, Number(e.target.value)||2000)))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Max months</label>
          <Input type="number" value={duration} min={6} max={60} onChange={e=>setDuration(Math.max(6, Math.min(60, Number(e.target.value)||36)))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={run} disabled={loading}>{loading ? 'Simulating...' : 'Run Simulation'}</Button>
        {loading && <LoadingSpinner size="sm" />}
        {error && <div className="text-xs text-red-600 ml-2">{error}</div>}
      </div>
      {result && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="p-2 rounded border">
            <div className="text-[10px] text-gray-500">P50 timeline</div>
            <div className="text-sm font-semibold">{result.months_p50} mo</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-[10px] text-gray-500">P90 timeline</div>
            <div className="text-sm font-semibold">{result.months_p90} mo</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-[10px] text-gray-500">Success @12m</div>
            <div className="text-sm font-semibold">{Math.round(result.p_success_12m*100)}%</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-[10px] text-gray-500">Success @18m</div>
            <div className="text-sm font-semibold">{Math.round(result.p_success_18m*100)}%</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-[10px] text-gray-500">Success @24m</div>
            <div className="text-sm font-semibold">{Math.round(result.p_success_24m*100)}%</div>
          </div>
          {typeof result.median_salary_at_completion === 'number' && (
            <div className="p-2 rounded border col-span-2">
              <div className="text-[10px] text-gray-500">Median salary at completion</div>
              <div className="text-sm font-semibold">${result.median_salary_at_completion.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
