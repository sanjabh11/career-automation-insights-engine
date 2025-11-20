import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedAnalysesUnified } from "@/hooks/useSavedAnalysesUnified";

const ComparePage: React.FC = () => {
  const { savedAnalyses, isLoading } = useSavedAnalysesUnified();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // limit 2
      return [...prev, id];
    });
  };

  const selectedItems = useMemo(
    () => savedAnalyses.filter((a: any) => selected.includes(a.id)),
    [savedAnalyses, selected]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold">Compare Saved Analyses</h1>
        <Badge variant="secondary">{savedAnalyses.length}</Badge>
      </div>

      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Select up to 2 analyses</h2>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : savedAnalyses.length === 0 ? (
          <div className="text-gray-500 text-sm">No saved analyses available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedAnalyses.map((a: any) => (
              <div key={a.id} className={`border rounded-md p-3 bg-gray-50 ${selected.includes(a.id) ? 'ring-2 ring-blue-400' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.occupation_title}</div>
                    <div className="text-xs text-gray-600">{a.occupation_code}</div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={`Select ${a.occupation_title}`}
                    checked={selected.includes(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    className="mt-1"
                  />
                </div>
                {Array.isArray(a.tags) && a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.map((t: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 mt-2">
                  Saved on {a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
        {selected.length > 2 && (
          <div className="text-sm text-red-600 mt-2">Please select at most 2 analyses.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedItems.map((a: any) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{a.occupation_title}</div>
              <Badge variant="outline">{a.occupation_code}</Badge>
            </div>
            {Array.isArray(a.tags) && a.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {a.tags.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
            {a.notes && (
              <div className="text-sm bg-white border rounded p-2 text-gray-700 mb-2">{a.notes}</div>
            )}
            <div className="text-xs text-gray-500">
              Created {a.created_at ? new Date(a.created_at).toLocaleString() : '-'}
              {" • "}
              Updated {a.updated_at ? new Date(a.updated_at).toLocaleString() : '-'}
            </div>
          </Card>
        ))}
      </div>

      {selected.length === 0 && (
        <div className="text-sm text-gray-500 mt-4">Select items above to compare.</div>
      )}
    </div>
  );
};

export default ComparePage;
