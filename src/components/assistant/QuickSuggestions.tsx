import React from "react";

export function QuickSuggestions({ items, onSelect }: { items: string[]; onSelect: (text: string) => void }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
