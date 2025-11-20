import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle, BookOpen, Keyboard, ArrowRight } from "lucide-react";

export default function HelpPage() {
  const glossary: Array<{ term: string; definition: string }> = [
    { term: "APO Score", definition: "Automation Potential (0–100). Lower = less automation risk." },
    { term: "Confidence", definition: "Quality of evidence supporting the estimate (high/medium/low)." },
    { term: "Timeline", definition: "Estimated window when automation impact is likely to manifest." },
    { term: "ROI (months)", definition: "Months to break even on an automation/learning investment." },
    { term: "BLS Trend", definition: "Latest employment trend for the occupation from BLS data." },
    { term: "Sharpe Ratio", definition: "Return per unit of risk. Higher = more efficient portfolio." },
  ];

  const quickSteps = [
    { title: "Search", desc: "Find an occupation using the search bar on the home page." },
    { title: "Analyze", desc: "Open an occupation to view automation insights and evidence." },
    { title: "Explain", desc: "Use 'Explain APO' for a plain-language breakdown of your score." },
    { title: "Plan", desc: "Open Career Impact Planner to explore recommendations." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-600" /> Help & Getting Started
            </h1>
            <p className="text-sm text-muted-foreground">
              Quick tips, glossary, and shortcuts to understand results and navigate the app.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Quick Start</h2>
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            {quickSteps.map((s, i) => (
              <li key={i}>
                <span className="font-medium">{s.title}:</span> {s.desc}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Glossary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {glossary.map((g) => (
              <div key={g.term} className="border rounded-lg p-4">
                <div className="text-sm font-semibold">{g.term}</div>
                <div className="text-sm text-gray-600 mt-1">{g.definition}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Shortcuts</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">?</span> Open Help from anywhere
            </li>
          </ul>
        </Card>

        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <a href="/resources">Resources & Documentation</a>
          </Button>
          <div className="text-xs text-muted-foreground">Need more? Use the Explain APO panel on any analysis.</div>
        </div>
      </div>
    </div>
  );
}
