import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/useProgress";

export function ProgressWidget() {
  const { overall, logMinutes, addMilestone, completeMilestone, getState } = useProgress();
  const [_, force] = React.useState(0);
  const refresh = () => force((n) => n + 1);

  const o = overall();
  const s = getState();

  const addDefaultMilestones = () => {
    addMilestone("Finish first course/module", 300);
    addMilestone("Build a small portfolio project", 480);
    addMilestone("Apply to 3 roles or informational chats", 60);
    refresh();
  };

  return (
    <Card className="rounded-2xl shadow-md border-0">
      <CardHeader>
        <CardTitle className="text-base">Learning Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Overall</span>
            <span>{o.pct}%</span>
          </div>
          <Progress value={o.pct} />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Streak: {o.streak} day(s)</span>
            <span>Total: {Math.round((o.totalMinutes || 0) / 60)}h</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { logMinutes(15); refresh(); }}>+15m</Button>
          <Button size="sm" variant="outline" onClick={() => { logMinutes(30); refresh(); }}>+30m</Button>
          <Button size="sm" variant="outline" onClick={() => { logMinutes(60); refresh(); }}>+60m</Button>
          <Button size="sm" onClick={addDefaultMilestones}>Add Milestones</Button>
        </div>

        {s.milestones.length > 0 && (
          <div className="space-y-2">
            {s.milestones.map((m) => (
              <div key={m.id} className="text-sm p-2 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">Target: {m.targetMinutes ?? 0}m</div>
                </div>
                <div className="flex items-center gap-2">
                  {!m.done && (
                    <Button size="sm" variant="outline" onClick={() => { completeMilestone(m.id); refresh(); }}>Done</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
