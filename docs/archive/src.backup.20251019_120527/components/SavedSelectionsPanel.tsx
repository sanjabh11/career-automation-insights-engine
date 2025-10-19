
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Plus, Trash, PencilLine, Upload } from "lucide-react";
import { useSavedSelections, SavedSelection } from "@/hooks/useSavedSelections";

interface SavedSelectionsPanelProps<T> {
  selections: T;
  onLoad: (selection: T) => void;
  listName?: string;
}

export function SavedSelectionsPanel<T extends any[]>({
  selections,
  onLoad,
  listName,
}: SavedSelectionsPanelProps<T>) {
  const { saved, saveList, updateName, removeList } = useSavedSelections<T>();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Bookmark className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Saved Selections</h3>
      </div>
      <div className="space-y-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim() || !selections.length) return;
            saveList(newName.trim(), selections);
            setNewName("");
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name this selection…"
            className="w-full max-w-xs"
            data-testid="save-selection-input"
          />
          <Button
            disabled={!newName.trim() || !selections.length}
            type="submit"
            size="sm"
            data-testid="save-selection-btn"
          >
            <Plus className="w-4 h-4 mr-1" /> Save
          </Button>
        </form>
      </div>
      <div className="mt-4 space-y-2">
        {saved.length === 0 && (
          <p className="text-xs text-gray-500">No saved selections yet.</p>
        )}
        {saved.map((s) => (
          <div key={s.id} className="flex items-center gap-2 justify-between bg-slate-50 rounded-md px-3 py-2">
            <div className="flex-1 flex gap-2 items-center">
              <Badge className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700">
                Saved {new Date(s.createdAt).toLocaleDateString()}
              </Badge>
              {editingId === s.id ? (
                <form
                  className="flex gap-1"
                  onSubmit={e => {
                    e.preventDefault();
                    if (editValue.trim()) {
                      updateName(s.id, editValue.trim());
                      setEditingId(null);
                    }
                  }}
                >
                  <Input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    size={10}
                    className="max-w-[120px] text-xs"
                    autoFocus
                  />
                  <Button size="sm" type="submit">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    type="button"
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="font-medium text-gray-700 text-sm">{s.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Rename"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditValue(s.name);
                    }}
                  >
                    <PencilLine className="w-4 h-4 text-gray-400" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                title="Load selection"
                onClick={() => onLoad(s.data)}
                data-testid={`load-selection-btn-${s.id}`}
              >
                <Upload className="w-4 h-4 text-blue-700" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                title="Delete selection"
                onClick={() => removeList(s.id)}
                data-testid={`delete-selection-btn-${s.id}`}
              >
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
