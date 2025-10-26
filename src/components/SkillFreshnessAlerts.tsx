import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Derived {
  recommendedHours: number | null;
  monthsToCritical: number | null;
  belowCritical: boolean;
  critical: number;
}

export function SkillFreshnessAlerts({ skill, derived }: { skill: string; derived: Derived | null }) {
  if (!derived) return null;
  const { recommendedHours, monthsToCritical, belowCritical, critical } = derived;

  const handleRemind = () => {
    try {
      const key = `reminder:${skill}`;
      const at = new Date();
      const months = Math.max(1, Math.min(12, (monthsToCritical ?? 3)));
      at.setMonth(at.getMonth() + months);
      localStorage.setItem(key, JSON.stringify({ skill, remindAt: at.toISOString(), createdAt: new Date().toISOString() }));
      alert(`Reminder set for ~${months} months from now`);
    } catch {}
  };

  return (
    <div className="p-2 bg-white rounded border">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge className={belowCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
          {belowCritical ? 'Below critical' : `Critical in ~${monthsToCritical ?? '—'} mo`}
        </Badge>
        <span>Threshold ≤{critical}%</span>
        {recommendedHours != null && (
          <span>• Maintain ~{recommendedHours} hrs/mo</span>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={handleRemind}>Remind me</Button>
      </div>
    </div>
  );
}
