import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

// Minimal RIASEC (Holland) profiler: 18 items (3 per theme)
// Scale: 1 (Dislike) to 5 (Enjoy)
const QUESTIONS: Array<{ id: string; theme: "R"|"I"|"A"|"S"|"E"|"C"; text: string }> = [
  { id: "r1", theme: "R", text: "Fix or assemble things with tools" },
  { id: "r2", theme: "R", text: "Operate machinery or equipment" },
  { id: "r3", theme: "R", text: "Work outdoors on practical tasks" },
  { id: "i1", theme: "I", text: "Analyze data to find patterns" },
  { id: "i2", theme: "I", text: "Design experiments or models" },
  { id: "i3", theme: "I", text: "Solve complex technical problems" },
  { id: "a1", theme: "A", text: "Create art, designs, or media" },
  { id: "a2", theme: "A", text: "Write stories or craft visuals" },
  { id: "a3", theme: "A", text: "Imagine new product ideas" },
  { id: "s1", theme: "S", text: "Teach or mentor others" },
  { id: "s2", theme: "S", text: "Support people through services" },
  { id: "s3", theme: "S", text: "Facilitate collaboration in groups" },
  { id: "e1", theme: "E", text: "Lead teams toward goals" },
  { id: "e2", theme: "E", text: "Sell ideas or products" },
  { id: "e3", theme: "E", text: "Make decisions with business impact" },
  { id: "c1", theme: "C", text: "Organize information accurately" },
  { id: "c2", theme: "C", text: "Work with spreadsheets or records" },
  { id: "c3", theme: "C", text: "Follow clear procedures reliably" },
];

export default function ProfilerPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [computed, setComputed] = useState<string | null>(null);

  const score = useMemo(() => {
    const themes: Record<string, number> = { R:0,I:0,A:0,S:0,E:0,C:0 };
    for (const q of QUESTIONS) {
      const v = Number(answers[q.id] || 0);
      themes[q.theme] += v;
    }
    return themes;
  }, [answers]);

  const code = useMemo(() => {
    const entries = Object.entries(score).sort((a,b)=>b[1]-a[1]);
    return entries.slice(0,3).map(([k])=>k).join("");
  }, [score]);

  const handleSubmit = () => {
    setComputed(code);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interest Profiler (RIASEC)</h1>
        <p className="text-sm text-muted-foreground">Quick 18-question profiler to suggest matching career discovery paths.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUESTIONS.map((q, idx) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx*0.02 }}>
              <Card className="p-3">
                <div className="text-sm mb-2">{q.text}</div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((v)=>(
                    <Button key={v} size="sm" variant={(answers[q.id]||0)===v?"default":"outline"} onClick={()=>setAnswers(a=>({...a,[q.id]:v}))}>{v}</Button>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Scores update as you click. Choose what fits you best.</div>
          <Button onClick={handleSubmit}>Compute Profile</Button>
        </div>
      </Card>

      {computed && (
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Top 3 code</div>
          <div className="text-2xl font-bold">{computed}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/?riasec=${computed}`}>Open Dashboard with Profile →</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/industry">Explore by Clusters</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/browse/bright-outlook">See Bright Outlook Careers</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
