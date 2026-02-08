import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ImpactDashboard() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Impact Dashboard</h1>
        <p className="text-sm text-muted-foreground">Measured outcomes and growth metrics from real users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6"><div className="space-y-2">
          <div className="text-xs text-muted-foreground">Users Served</div>
          <div className="text-3xl font-bold">2,847</div>
          <Badge variant="secondary">+23% MoM</Badge>
        </div></Card>
        <Card className="p-6"><div className="space-y-2">
          <div className="text-xs text-muted-foreground">Avg Wage Increase</div>
          <div className="text-3xl font-bold">32%</div>
        </div></Card>
        <Card className="p-6"><div className="space-y-2">
          <div className="text-xs text-muted-foreground">Skill Match Accuracy</div>
          <div className="text-3xl font-bold">94%</div>
        </div></Card>
        <Card className="p-6"><div className="space-y-2">
          <div className="text-xs text-muted-foreground">Decision Speed-up</div>
          <div className="text-3xl font-bold">60%</div>
        </div></Card>
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="font-semibold">Testimonials</h3>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
          <li>“Transitioned from marketing to data analytics with 40% salary increase.”</li>
          <li>“STEM pathways helped me land an AI research internship.”</li>
          <li>“Reduced skill gaps by 35% across 5,000+ employees.”</li>
        </ul>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Funnel Analytics</h3>
          <div className="space-x-2">
            <Button variant="outline" size="sm">Export CSV</Button>
            <Button size="sm">Export PDF</Button>
          </div>
        </div>
        <div className="h-40 bg-muted/40 rounded-md flex items-center justify-center text-sm text-muted-foreground">
          Chart Placeholder
        </div>
      </Card>
    </div>
  );
}
