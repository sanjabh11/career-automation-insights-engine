import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type ExampleKey = 'portfolio' | 'apo' | 'sharpe_ratio';

const EXAMPLES: Record<ExampleKey, { title: string; description?: string; body: React.ReactNode }> = {
  portfolio: {
    title: "Example: Portfolio Optimization",
    description: "How rebalancing reduces risk and improves efficiency.",
    body: (
      <div className="space-y-3 text-sm">
        <div className="font-medium">Before</div>
        <ul className="list-disc pl-5">
          <li>82% skills in one cluster (Web)</li>
          <li>Sharpe ratio: 0.73 (inefficient)</li>
          <li>High correlation = concentrated risk</li>
        </ul>
        <div className="font-medium mt-3">After</div>
        <ul className="list-disc pl-5">
          <li>45% Web, 25% Mobile, 20% Cloud, 10% DevOps</li>
          <li>Sharpe ratio: 1.9 (better efficiency)</li>
          <li>Uncorrelated skills added as hedges</li>
        </ul>
        <div className="text-xs text-muted-foreground">Result: Downturns in one area impact you less; earning resilience improves.</div>
      </div>
    ),
  },
  apo: {
    title: "Example: Understanding APO 42/100",
    body: (
      <div className="space-y-3 text-sm">
        <div className="font-medium">Interpretation</div>
        <ul className="list-disc pl-5">
          <li>Moderate risk overall</li>
          <li>Some routine tasks will automate; focus on augmentation</li>
          <li>Develop human-essential and AI-collaboration skills</li>
        </ul>
      </div>
    ),
  },
  sharpe_ratio: {
    title: "Example: Sharpe Ratio Analogy",
    body: (
      <div className="space-y-3 text-sm">
        <p>Think of Sharpe like miles-per-gallon (MPG). Higher MPG = more efficient. Similarly, higher Sharpe = more return per unit of risk.</p>
        <ul className="list-disc pl-5">
          <li>0.8 = Inefficient; too much risk for the return</li>
          <li>1.5 = Good balance; diversified and resilient</li>
          <li>2.0+ = Excellent portfolio efficiency</li>
        </ul>
      </div>
    ),
  },
};

export function ExampleModal({ open, onClose, exampleKey }: { open: boolean; onClose: () => void; exampleKey: ExampleKey }) {
  const ex = EXAMPLES[exampleKey];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ex.title}</DialogTitle>
          {ex.description && <DialogDescription>{ex.description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-2">{ex.body}</div>
      </DialogContent>
    </Dialog>
  );
}
