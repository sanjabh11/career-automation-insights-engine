import React from "react";
import { CrosswalkWizard } from "@/components/CrosswalkWizard";

export default function CrosswalkPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Crosswalk Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Map between SOC, MOC, CIP, ESCO, RAPIDS, and DOT using the live/cached Supabase edge function.
        </p>
      </div>
      <CrosswalkWizard />
    </div>
  );
}
