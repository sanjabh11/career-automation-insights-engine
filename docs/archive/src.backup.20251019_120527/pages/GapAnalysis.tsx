import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type GapItem = {
  category: string;
  feature: string;
  score: number; // 0-5
  evidence: string;
  gaps: string[];
  action: string;
};

function scoreColor(score: number): string {
  if (score >= 4.5) return "bg-emerald-600";
  if (score >= 3.5) return "bg-amber-600";
  return "bg-rose-600";
}

export default function GapAnalysis() {
  const items: GapItem[] = useMemo(
    () => [
      {
        category: "Search & Discovery",
        feature: "Occupation Search (O*NET proxy)",
        score: 4.2,
        evidence: "Edge function `onet-proxy` present; `SearchInterface` component exists.",
        gaps: ["Confirm debounce, empty-state UX, and error surface."],
        action: "Harden search UX and error handling.",
      },
      {
        category: "Search & Discovery",
        feature: "Advanced Filtering",
        score: 4.2,
        evidence: "`filters` function and `useFilters` hook present.",
        gaps: ["Document available filters; add multi-select chips."],
        action: "Expose filters visually in search UI.",
      },
      {
        category: "Search & Discovery",
        feature: "Search History",
        score: 4.0,
        evidence: "`useSearchHistory` and `SearchHistoryPanel` components present.",
        gaps: ["Ensure persistence and list UI wired to search page."],
        action: "Mount panel on search page and add clear/restore.",
      },
      {
        category: "AI-Powered Analysis",
        feature: "APO Calculation & Breakdown",
        score: 4.6,
        evidence: "`calculate-apo` function; `AIImpactDashboard` components." ,
        gaps: ["Validate category weights vs PRD."],
        action: "Add unit tests for scoring consistency.",
      },
      {
        category: "AI-Powered Analysis",
        feature: "Confidence & Timeline Predictions",
        score: 4.0,
        evidence: "`ConfidenceTimelinePredictions` page exists.",
        gaps: ["Calibrate confidence bands; show rationale."],
        action: "Render rationale with citations.",
      },
      {
        category: "Data Management",
        feature: "Save Analyses",
        score: 4.0,
        evidence: "`useSavedAnalyses` hooks exist; shared page present.",
        gaps: ["Ensure Supabase tables and optimistic UI."],
        action: "Wire CRUD with loading/empty states.",
      },
      {
        category: "Data Management",
        feature: "Export CSV/PDF",
        score: 4.8,
        evidence: "`exportToCSV` and `exportToPDF` utilities present.",
        gaps: ["Hook to visible buttons across dashboards."],
        action: "Place export buttons in headers.",
      },
      {
        category: "Data Management",
        feature: "Tagging System",
        score: 3.8,
        evidence: "Migration `add_analysis_tags` present.",
        gaps: ["Tag input UI; filter by tag; display chips."],
        action: "Add tag editor to Save modal and list filters.",
      },
      {
        category: "UX",
        feature: "Accessibility",
        score: 4.2,
        evidence: "`AccessibilityProvider` and `AccessibilityToolbar` present.",
        gaps: ["Audit key flows; fix focus traps.", "WCAG labels on new pages"],
        action: "Run automated and manual audits.",
      },
      {
        category: "Security & Privacy",
        feature: "Security Headers & Input Sanitization",
        score: 4.6,
        evidence: "`SecurityHeaders` component; sanitization utils; rate limiting util.",
        gaps: ["Verify CSP covers Gemini endpoints; tighten iframe rules."],
        action: "Update CSP and run ZAP baseline.",
      },
      {
        category: "AI Impact Planner",
        feature: "Task Assessment (Automate/Augment/Human-only)",
        score: 4.3,
        evidence: "Edge functions `assess-task`, `analyze-occupation-tasks` present.",
        gaps: ["Inline feedback loop; example tasks per occupation."],
        action: "Add helper suggestions and caching.",
      },
      {
        category: "AI Impact Planner",
        feature: "Skill Recommendations & Resources",
        score: 4.2,
        evidence: "`skill-recommendations` + `free-courses` functions; resources table seeded.",
        gaps: ["Merge skills with resources view; sort by priority."],
        action: "Unified panel with grouping and quick-save.",
      },
      {
        category: "Tracking & Analytics",
        feature: "LLM Logs & Web Vitals",
        score: 3.8,
        evidence: "`llm_logs` migration; web vitals log to console only.",
        gaps: ["Persist vitals to DB; sample and visualize."],
        action: "Create `web_vitals` table and send metrics.",
      },
      {
        category: "Collaboration",
        feature: "Share Analyses",
        score: 4.4,
        evidence: "`send-shared-analysis` function and `/shared/:token` page.",
        gaps: ["Share permissions and expiry policy toggle."],
        action: "Add expiry selector to share modal.",
      },
    ],
    []
  );

  const belowThreshold = items.filter((i) => i.score < 4.5);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Gap Analysis</h1>
        <div className="flex items-center gap-2">
          <Link to="/"><Button variant="secondary">Home</Button></Link>
          <Link to="/api-health"><Button variant="outline">API Health</Button></Link>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Scale: 0–5</Badge>
          <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${scoreColor(4.7)}`}></span><span className="text-sm text-muted-foreground">Good ≥ 4.5</span></div>
          <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${scoreColor(3.7)}`}></span><span className="text-sm text-muted-foreground">Needs attention 3.5–4.49</span></div>
          <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${scoreColor(2.4)}`}></span><span className="text-sm text-muted-foreground">High priority &lt; 3.5</span></div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Gaps</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                <TableCell className="font-medium">{item.feature}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${scoreColor(item.score)}`}></span>
                    <span>{item.score.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.evidence}</TableCell>
                <TableCell>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {item.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button size="sm" variant={item.score < 3.5 ? "destructive" : item.score < 4.5 ? "default" : "secondary"}>
                    {item.action}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-2">Immediate Implementation Queue</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The following items are below 4.5 and queued for implementation now.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {belowThreshold.map((b, i) => (
            <div key={i} className="flex items-start justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{b.feature}</div>
                <div className="text-xs text-muted-foreground">{b.category} • Score {b.score.toFixed(1)}</div>
              </div>
              <Button size="sm" asChild>
                <Link to={"/ai-impact"}>Work on it</Link>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


