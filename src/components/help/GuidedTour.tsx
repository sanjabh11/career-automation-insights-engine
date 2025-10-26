import React from "react";
import { Button } from "@/components/ui/button";

export type TourStep = {
  title: string;
  description: string;
};

export function GuidedTour({ storageKey = "tour:home:v1", steps }: { storageKey?: string; steps: TourStep[] }) {
  const [open, setOpen] = React.useState(() => localStorage.getItem(storageKey) !== "done");
  const [i, setI] = React.useState(0);

  if (!open || steps.length === 0) return null;

  const next = () => {
    if (i < steps.length - 1) setI(i + 1);
    else {
      localStorage.setItem(storageKey, "done");
      setOpen(false);
    }
  };
  const prev = () => setI(Math.max(0, i - 1));
  const skip = () => { localStorage.setItem(storageKey, "done"); setOpen(false); };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={skip} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto max-w-md w-[92%] sm:w-[520px] mx-auto mt-24 bg-white rounded-xl shadow-2xl p-5">
          <div className="text-sm text-gray-500">Step {i + 1} of {steps.length}</div>
          <h3 className="text-lg font-semibold mt-1">{steps[i].title}</h3>
          <p className="text-sm text-gray-700 mt-2">{steps[i].description}</p>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={skip}>Skip</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prev} disabled={i === 0}>Back</Button>
              <Button size="sm" onClick={next}>{i === steps.length - 1 ? 'Finish' : 'Next'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
