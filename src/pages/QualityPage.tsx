import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Activity, Keyboard, GaugeCircle, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function QualityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["quality-webvitals"],
    queryFn: async () => {
      const d14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("web_vitals")
        .select("name, value, created_at")
        .gte("created_at", d14)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 60_000,
  });

  const lcp = (data || []).filter((v: any) => (v.name || "").toUpperCase().includes("LCP"));
  const avgLcp = lcp.length ? Math.round(lcp.reduce((a: number, b: any) => a + Number(b.value || 0), 0) / lcp.length) : 0;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quality & Accessibility</h1>
        <p className="text-sm text-muted-foreground">WCAG 2.1 AA progress, Lighthouse scores, keyboard navigation map, and performance budgets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Lighthouse</div>
          <div className="flex items-center gap-2">
            <GaugeCircle className="h-6 w-6 text-green-600" />
            <div className="text-sm">Badges (mobile/desktop): add screenshots of latest runs</div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Run: <code>npx lighthouse http://localhost:5173 --view</code></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Web Vitals (last 14d)</div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            <div>
              <div className="text-3xl font-bold">{isLoading ? "–" : `${avgLcp} ms`}</div>
              <div className="text-xs text-muted-foreground">Avg LCP</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Accessibility</div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <div className="text-sm">AA Checklist — headings, contrast, labels, focus order</div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Use the built-in Accessibility Toolbar and run axe DevTools.</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Keyboard Navigation Map</h3>
          <Badge variant="secondary">AA</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Key Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>/</TableCell>
              <TableCell className="text-sm text-muted-foreground">Search (/, Enter), open details (Enter), focus panels (Tab)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>/ai-impact</TableCell>
              <TableCell className="text-sm text-muted-foreground">Run analysis (Enter), tabs (Arrow keys), export (E)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>/work-dimensions</TableCell>
              <TableCell className="text-sm text-muted-foreground">Switch tabs (Arrow keys), set filters (Tab + Space)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button variant="outline" className="gap-2" asChild>
            <a href="/docs/QUALITY_CHECKLIST.pdf"><Download className="h-4 w-4" /> Download Checklist</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
