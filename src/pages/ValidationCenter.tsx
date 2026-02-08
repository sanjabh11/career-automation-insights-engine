import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ValidationCenter() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Validation & Trust Center</h1>
        <p className="text-sm text-muted-foreground">Full transparency: model cards, calibration, fairness, robustness.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 space-y-2">
          <div className="text-xs text-muted-foreground">Model Accuracy</div>
          <div className="text-3xl font-bold">92.3%</div>
        </Card>
        <Card className="p-6 space-y-2">
          <div className="text-xs text-muted-foreground">Expected Calibration Error</div>
          <div className="text-3xl font-bold">0.042</div>
        </Card>
        <Card className="p-6 space-y-2">
          <div className="text-xs text-muted-foreground">Fairness Score</div>
          <div className="text-3xl font-bold">0.89</div>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Model Cards & Artifacts</h3>
          <div className="space-x-2">
            <Button size="sm">Download Model Card</Button>
            <Button variant="outline" size="sm">Download Calibration</Button>
          </div>
        </div>
        <div className="h-40 bg-muted/40 rounded-md flex items-center justify-center text-sm text-muted-foreground">
          Calibration Plots Placeholder
        </div>
      </Card>
    </div>
  );
}
