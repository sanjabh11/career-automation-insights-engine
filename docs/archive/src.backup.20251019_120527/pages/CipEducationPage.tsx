import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, GraduationCap, Download } from "lucide-react";

export default function CipEducationPage() {
  const [cip, setCip] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const crosswalkQuery = useQuery({
    queryKey: ["cip-xwalk", submitted],
    queryFn: async () => {
      if (!submitted) return null;
      const { data, error } = await supabase.functions.invoke("crosswalk", {
        body: { from: "CIP", code: submitted, to: "SOC" },
      });
      if (error) throw error;
      return data as any;
    },
    enabled: !!submitted,
    staleTime: 60_000,
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const fetchCourses = async (occupationTitle: string) => {
    try {
      setLoadingCourses(true);
      const keywords = occupationTitle.split(/\W+/).filter(Boolean).slice(0,3);
      const { data, error } = await supabase.functions.invoke('course-search', {
        body: { skills: keywords, level: 'any', budget: 'any', duration: 'any' }
      });
      if (error) throw error;
      setCourses((data?.courses || []).slice(0, 10));
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const exportCSV = () => {
    try {
      const header = ["title","provider","url","duration","level","price"];
      const csv = [header.join(","), ...courses.map((c:any)=> header.map(h=>JSON.stringify(c[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `cip_${submitted}_programs_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CIP → Education Programs</h1>
        <p className="text-sm text-muted-foreground">Map a CIP code to SOC and fetch example programs/courses to build your learning plan. Export results for demos.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Enter CIP code (e.g., 11.0701)" value={cip} onChange={(e)=>setCip(e.target.value)} />
          <Button onClick={()=>setSubmitted(cip.trim())} disabled={!cip.trim() || crosswalkQuery.isFetching}>
            {crosswalkQuery.isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/>: null}
            Map CIP
          </Button>
        </div>

        {submitted && crosswalkQuery.isSuccess && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Crosswalk Results</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(() => {
                const results: any[] = Array.isArray(crosswalkQuery.data?.results) ? crosswalkQuery.data.results : (Array.isArray(crosswalkQuery.data) ? crosswalkQuery.data : []);
                return results.slice(0,6).map((r: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className="font-semibold text-sm">{r.title || r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.code || r.onetsoc_code}</div>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => fetchCourses(String(r.title || r.name || ''))}>Fetch Programs</Button>
                    </div>
                  </Card>
                ));
              })()}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Suggested Programs</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={exportCSV} disabled={courses.length===0}><Download className="h-4 w-4"/> Export CSV</Button>
            </div>
          </div>
          {loadingCourses && <div className="text-sm text-muted-foreground">Loading programs…</div>}
          {!loadingCourses && courses.length === 0 && <div className="text-sm text-muted-foreground">No courses yet. Map a CIP and click Fetch Programs on a result.</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((c:any, i:number) => (
              <Card key={i} className="p-4">
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.provider} • {c.level} • {c.duration}</div>
                <div className="text-xs text-green-700">{c.price}</div>
                <Button asChild variant="link" className="h-auto p-0 text-xs mt-1"><a href={c.url} target="_blank" rel="noreferrer">Open →</a></Button>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
