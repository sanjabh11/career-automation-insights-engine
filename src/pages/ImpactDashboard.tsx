import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  activationRetentionEventCatalog,
  commercialValidationEvidenceGates,
  retentionCohortDefinitions,
} from "@/lib/commercialLaunchReadiness";

export default function ImpactDashboard() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Impact Evidence Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Activation, retention, and commercial-validation evidence boundaries as of 2026-05-31.
          This route does not claim wage gains, placement outcomes, or live revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {commercialValidationEvidenceGates.map((gate) => (
          <Card key={gate.gate} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold leading-5">{gate.gate}</div>
              <Badge variant={gate.status === "local_ready" ? "secondary" : "outline"}>
                {gate.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{gate.currentProof}</p>
            <p className="text-xs leading-5 text-amber-700">{gate.doesNotProve}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="font-semibold">Evidence Intake Needed</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {retentionCohortDefinitions.map((cohort) => (
            <div key={cohort.cohort} className="rounded-md border p-3">
              <div className="text-sm font-medium">{cohort.cohort}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{cohort.successCriterion}</p>
              <p className="mt-2 text-xs leading-5 text-amber-700">{cohort.remainingAction}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Instrumented Event Catalog</h3>
          <div className="space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/proof-pack-gallery">Open Proof Pack</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/outcomes">View Telemetry</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {activationRetentionEventCatalog.map((event) => (
            <div key={event.eventName} className="rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{event.eventName}</span>
                <Badge variant="outline">{event.funnelStage}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.currentProof}</p>
              <p className="mt-2 text-xs leading-5 text-amber-700">{event.remainingAction}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
