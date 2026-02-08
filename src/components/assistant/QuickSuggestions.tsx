import React from "react";

export function QuickSuggestions({ items, onSelect }: { items: string[]; onSelect: (text: string) => void }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="px-2.5 py-1 text-xs rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
