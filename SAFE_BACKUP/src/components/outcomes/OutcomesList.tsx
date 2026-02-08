import React from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function OutcomesList() {
  const { user } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);

  const fetchRows = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_outcomes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRows(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load outcomes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => { fetchRows(); }, [fetchRows]);

  React.useEffect(() => {
    const onCreated = () => fetchRows();
    window.addEventListener('outcome:created', onCreated);
    return () => window.removeEventListener('outcome:created', onCreated);
  }, [fetchRows]);

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold mb-2">Recent Outcomes</div>
      {!user ? (
        <div className="text-xs text-gray-600">Sign in to view your outcomes.</div>
      ) : loading ? (
        <div className="py-2"><LoadingSpinner size="sm" /></div>
      ) : error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-gray-600">No outcomes yet. Submit your first one above.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Goal</th>
                <th className="text-right p-2">Hours</th>
                <th className="text-right p-2">New Salary</th>
                <th className="text-right p-2">Months</th>
                <th className="text-right p-2">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{r.goal_occupation || '—'}</td>
                  <td className="p-2 text-right">{r.completed_learning_hours ?? '—'}</td>
                  <td className="p-2 text-right">{r.new_salary != null ? `$${Math.round(r.new_salary).toLocaleString()}` : '—'}</td>
                  <td className="p-2 text-right">{r.transition_months ?? '—'}</td>
                  <td className="p-2 text-right">{r.satisfaction_score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
