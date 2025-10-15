import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCrosswalk, CrosswalkFrom, CrosswalkTo } from "@/hooks/useCrosswalk";
import { Loader2 } from "lucide-react";

const FROM_OPTIONS: CrosswalkFrom[] = ["SOC", "MOC", "CIP", "RAPIDS", "ESCO", "DOT", "OOH"];
const TO_OPTIONS: (CrosswalkTo | "ALL")[] = ["ALL", "SOC", "MOC", "CIP", "RAPIDS", "ESCO", "DOT"];

export function CrosswalkWizard() {
  const [from, setFrom] = useState<CrosswalkFrom>("SOC");
  const [code, setCode] = useState("");
  const [to, setTo] = useState<CrosswalkTo | "ALL">("ALL");
  const [submitted, setSubmitted] = useState<{ from: CrosswalkFrom; code: string; to?: CrosswalkTo } | null>(null);

  const params = useMemo(() => {
    if (!submitted) return null;
    return {
      from: submitted.from,
      code: submitted.code.trim(),
      to: submitted.to,
      enabled: true,
    } as const;
  }, [submitted]);

  const query = useCrosswalk<any>({
    from: params?.from || from,
    code: params?.code || code,
    to: params?.to,
    enabled: !!params && !!params.code,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitted({ from, code: code.trim(), to: to === "ALL" ? undefined : (to as CrosswalkTo) });
  };

  const data = query.data;

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">Crosswalk Wizard</h2>
        <p className="text-sm text-muted-foreground">
          Explore crosswalks between taxonomies (SOC, MOC, CIP, ESCO, RAPIDS, DOT). Uses the Supabase edge function
          <Badge variant="outline" className="ml-1">/crosswalk</Badge>
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3 space-y-2">
          <Label htmlFor="from">From</Label>
          <Select value={from} onValueChange={(v) => setFrom(v as CrosswalkFrom)}>
            <SelectTrigger id="from"><SelectValue placeholder="Select taxonomy" /></SelectTrigger>
            <SelectContent>
              {FROM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" placeholder="e.g. 15-1252 for SOC, 11B for MOC" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="md:col-span-3 space-y-2">
          <Label htmlFor="to">To (optional)</Label>
          <Select value={to} onValueChange={(v) => setTo(v as CrosswalkTo | "ALL") }>
            <SelectTrigger id="to"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              {TO_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" className="w-full" disabled={query.isFetching || !code.trim()}>
            {query.isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Explore
          </Button>
          {submitted && (
            <Button type="button" variant="outline" onClick={() => setSubmitted(null)} disabled={query.isFetching}>
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Results */}
      <div className="space-y-2">
        {query.isIdle && <p className="text-sm text-muted-foreground">Enter a code and click Explore to view mappings.</p>}
        {query.isError && (
          <p className="text-sm text-red-600">
            {(query.error as Error)?.message || "Error fetching crosswalk results."}
          </p>
        )}
        {query.isFetching && (
          <div className="text-sm text-muted-foreground">Loading crosswalk results…</div>
        )}
        {query.isSuccess && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Results</h3>
              <Badge variant="secondary">Cached/Live</Badge>
            </div>
            <ResultView data={data} />
          </div>
        )}
      </div>
    </Card>
  );
}

function ResultView({ data }: { data: any }) {
  // Attempt to find a sensible list to render; fallback to JSON
  const entries: any[] | null = useMemo(() => {
    if (!data) return null;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.mappings)) return data.mappings;
    if (Array.isArray(data?.items)) return data.items;
    return null;
  }, [data]);

  if (!data) return null;

  if (entries) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {entries.map((item, idx) => (
            <Card key={idx} className="p-3">
              <code className="text-xs block whitespace-pre-wrap break-words">{summarize(item)}</code>
            </Card>
          ))}
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">Raw JSON</summary>
          <pre className="text-xs p-3 bg-muted rounded-md overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <pre className="text-xs p-3 bg-muted rounded-md overflow-auto">{JSON.stringify(data, null, 2)}</pre>
  );
}

function summarize(item: any): string {
  if (!item) return "";
  const keys = Object.keys(item);
  // Heuristic display
  const code = item.code || item.to_code || item.target || item.id || "";
  const label = item.title || item.name || item.desc || item.label || "";
  const relate = item.type || item.rel || item.via || item.source || "";
  const parts = [code, label, relate].filter(Boolean);
  if (parts.length) return parts.join(" — ");
  // fallback to compact json
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}
