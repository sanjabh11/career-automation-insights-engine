import React from "react";

export type TourStep = {
  target_element?: string; // CSS selector
  title: string;
  description: string;
};

export function SpotlightTour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const step = steps[index];
    if (!step) return;
    let r: DOMRect | null = null;
    if (step.target_element) {
      const el = document.querySelector(step.target_element) as HTMLElement | null;
      if (el) r = el.getBoundingClientRect();
    }
    if (!r) {
      // fallback center box
      const vw = window.innerWidth, vh = window.innerHeight;
      r = new DOMRect(vw / 2 - 150, vh / 2 - 50, 300, 100);
    }
    setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
  }, [open, index, steps]);

  if (!open || !steps || steps.length === 0) return null;
  const step = steps[index];

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Spotlight hole using border trick */}
      {rect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boxShadow: `inset 0 0 0 9999px rgba(0,0,0,0.6), inset ${rect.left}px ${rect.top}px 0 0 rgba(0,0,0,0), inset 0 ${rect.top}px 0 0 rgba(0,0,0,0), inset calc(100% - ${rect.left + rect.width}px) 0 0 0 rgba(0,0,0,0), inset 0 calc(100% - ${rect.top + rect.height}px) 0 0 rgba(0,0,0,0)`,
          }}
        />
      )}
      {/* Tooltip panel */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-[92vw] p-4">
        <div className="text-sm font-semibold mb-1">{step.title}</div>
        <div className="text-xs text-gray-700 mb-3">{step.description}</div>
        <div className="flex justify-between text-xs">
          <button className="px-3 py-1 rounded border" onClick={onClose}>Skip</button>
          <div className="space-x-2">
            {index > 0 && (
              <button className="px-3 py-1 rounded border" onClick={() => setIndex(i => Math.max(0, i - 1))}>Previous</button>
            )}
            {index < steps.length - 1 ? (
              <button className="px-3 py-1 rounded bg-black text-white" onClick={() => setIndex(i => i + 1)}>Next</button>
            ) : (
              <button className="px-3 py-1 rounded bg-black text-white" onClick={onClose}>Finish</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
