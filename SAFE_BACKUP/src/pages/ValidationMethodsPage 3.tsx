import React from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface CalibBin { predicted_avg: number; observed_avg: number; bin_lower: number; bin_upper: number; count: number; }

export default function ValidationMethodsPage() {
  const [bins, setBins] = React.useState<CalibBin[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: runRow, error: runErr } = await supabase
          .from("calibration_runs")
          .select("id, created_at, bin_count")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (runErr) throw runErr;
        if (!runRow?.id) { setBins([]); return; }
        const { data: rows, error: resErr } = await supabase
          .from("calibration_results")
          .select("predicted_avg, observed_avg, bin_lower, bin_upper, count")
          .eq("run_id", runRow.id)
          .order("bin_lower", { ascending: true });
        if (resErr) throw resErr;
        setBins(rows || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load calibration data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const chartData = React.useMemo(() => {
    if (!bins || bins.length === 0) return null;
    return bins.map(b => ({ p: Math.max(0, Math.min(100, (b.predicted_avg || 0) * 100)), o: Math.max(0, Math.min(100, (b.observed_avg || 0) * 100)) }));
  }, [bins]);

  const diagonal = React.useMemo(() => [{ p: 0, o: 0 }, { p: 100, o: 100 }], []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="text-xl font-semibold mb-4">Methods & Ablations</div>
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">Calibration (ECE) – Predicted vs Observed</div>
          {loading ? (
            <div className="text-xs text-gray-600">Loading…</div>
          ) : error ? (
            <div className="text-xs text-red-600">{error}</div>
          ) : chartData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="p" tick={{ fontSize: 10 }} domain={[0,100]} label={{ value: "Predicted (%)", position: "insideBottom", offset: -2 }} />
                  <YAxis type="number" tick={{ fontSize: 10 }} domain={[0,100]} label={{ value: "Observed (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(v:number)=>`${v.toFixed(1)}%`} labelFormatter={(v:any)=>`Predicted ${Number(v).toFixed(1)}%`} />
                  <Line data={diagonal} type="monotone" dataKey="o" dot={false} stroke="#9ca3af" strokeDasharray="4 4" isAnimationActive={false} />
                  <Line type="monotone" dataKey="o" stroke="#7c3aed" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs text-gray-600">No calibration results yet. Run a calibration to populate data.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
