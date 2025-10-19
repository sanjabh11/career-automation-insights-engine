import React from "react";
import { CrosswalkWizard } from "@/components/CrosswalkWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CrosswalkPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Crosswalk Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Map between SOC, MOC, CIP, ESCO, RAPIDS, and DOT using the live/cached Supabase edge function.
        </p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ooh">OOH</TabsTrigger>
          <TabsTrigger value="esco">ESCO</TabsTrigger>
          <TabsTrigger value="dot">DOT</TabsTrigger>
          <TabsTrigger value="rapids">RAPIDS</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <CrosswalkWizard />
        </TabsContent>
        <TabsContent value="ooh">
          <Card className="p-4 mb-3 text-sm text-muted-foreground">Look up OOH codes and map to SOC/CIP/others. Export CSV from results panel.</Card>
          <CrosswalkWizard defaultFrom="OOH" defaultTo="SOC" />
        </TabsContent>
        <TabsContent value="esco">
          <Card className="p-4 mb-3 text-sm text-muted-foreground">Map ESCO roles to US SOC and other taxonomies. Export CSV from results panel.</Card>
          <CrosswalkWizard defaultFrom="ESCO" defaultTo="SOC" />
        </TabsContent>

        <TabsContent value="dot">
          <Card className="p-4 mb-3 text-sm text-muted-foreground">Map DOT codes to SOC and others. Paste a DOT code and Explore. Export via CSV.</Card>
          <CrosswalkWizard defaultFrom="DOT" defaultTo="SOC" />
        </TabsContent>

        <TabsContent value="rapids">
          <Card className="p-4 mb-3 text-sm text-muted-foreground">Map RAPIDS apprenticeship codes to SOC and others. Export CSV from results panel.</Card>
          <CrosswalkWizard defaultFrom="RAPIDS" defaultTo="SOC" />
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Educator packs with transition pathways and curricula</div>
          <Button variant="outline" asChild>
            <a href="/resources">View Educator Packs →</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
