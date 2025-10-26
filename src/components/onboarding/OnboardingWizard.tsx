import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export function OnboardingWizard() {
  const [open, setOpen] = React.useState(() => {
    try {
      return localStorage.getItem("wizard:status") !== "done";
    } catch { return true; }
  });
  const [step, setStep] = React.useState<number>(() => {
    try {
      const s = Number(localStorage.getItem("wizard:step") || "0");
      return Number.isFinite(s) ? Math.max(0, Math.min(4, s)) : 0;
    } catch { return 0; }
  });

  const [jobTitle, setJobTitle] = React.useState("");
  const [years, setYears] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");
  const [goals, setGoals] = React.useState<Record<string, boolean>>({ secure: false, transition: false, earning: false, futureproof: true, exploring: false });

  const steps = [
    { title: "Welcome", key: "welcome" },
    { title: "Quick Skills", key: "skills" },
    { title: "Career Context", key: "context" },
    { title: "Preview", key: "preview" },
    { title: "Feature Tour", key: "tour" }
  ];

  React.useEffect(() => {
    try {
      localStorage.setItem("wizard:step", String(step));
    } catch {}
  }, [step]);

  if (!open) return null;

  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  const finish = () => {
    try {
      localStorage.setItem("wizard:status", "done");
    } catch {}
    setOpen(false);
  };
  const skip = () => {
    try {
      localStorage.setItem("wizard:status", "done");
    } catch {}
    setOpen(false);
  };
  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50" onClick={skip} aria-hidden="true" />
      <div className="absolute inset-0 flex items-start justify-center pt-10 px-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Getting Started</CardTitle>
              <Badge variant="outline">Step {step + 1} of {steps.length}</Badge>
            </div>
            <div className="mt-2">
              <Progress value={progressPct} />
            </div>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-sm text-gray-700">We help you answer three questions.</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Which tasks will be automated or augmented</li>
                  <li>What skills to learn for best ROI</li>
                  <li>How to rebalance your skill portfolio</li>
                </ul>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={skip}>Skip</Button>
                  <Button onClick={next}>Start Setup</Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">Quick Skill Assessment</div>
                  <HelpTrigger entryKey="skill_half_life" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="Current job title (e.g., Marketing Manager)" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} />
                  <Input placeholder="Years of experience" value={years} onChange={e=>setYears(e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
                <div className="text-xs text-gray-600">Add a few core skills and the year learned.</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input placeholder="Skill (e.g., Python)" />
                  <Input placeholder="Level (e.g., Advanced)" />
                  <Input placeholder="Year learned (e.g., 2021)" />
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={back}>Back</Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Career Goals</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2"><Checkbox id="secure" checked={!!goals.secure} onCheckedChange={v=>setGoals(g=>({...g, secure: !!v}))} /><label htmlFor="secure" className="text-sm">Stay secure in current role</label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="transition" checked={!!goals.transition} onCheckedChange={v=>setGoals(g=>({...g, transition: !!v}))} /><label htmlFor="transition" className="text-sm">Transition to a new role</label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="earning" checked={!!goals.earning} onCheckedChange={v=>setGoals(g=>({...g, earning: !!v}))} /><label htmlFor="earning" className="text-sm">Maximize earning potential</label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="futureproof" checked={!!goals.futureproof} onCheckedChange={v=>setGoals(g=>({...g, futureproof: !!v}))} /><label htmlFor="futureproof" className="text-sm">Future-proof against automation</label></div>
                </div>
                <Input placeholder="Target role (optional)" value={targetRole} onChange={e=>setTargetRole(e.target.value)} />
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={back}>Back</Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Your First Analysis (Preview)</div>
                <div className="text-sm text-gray-600">Based on your inputs, you'll see automation risk, evidence, and recommended skills.</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="p-3"><div className="text-xs text-gray-500">Automation Potential</div><div className="text-lg font-bold">42/100</div></Card>
                  <Card className="p-3"><div className="text-xs text-gray-500">Top Recommendation</div><div className="text-sm">Learn Python + Data Analytics</div></Card>
                  <Card className="p-3"><div className="text-xs text-gray-500">ROI</div><div className="text-sm">Payback ~6 months</div></Card>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={back}>Back</Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Quick Feature Tour</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Skill Health (track depreciation)</li>
                  <li>Portfolio Optimizer (diversify skills)</li>
                  <li>Network Analysis (ecosystem risk)</li>
                  <li>Career Simulator (test scenarios)</li>
                </ul>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={back}>Back</Button>
                  <Button onClick={finish}>Finish Setup</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
