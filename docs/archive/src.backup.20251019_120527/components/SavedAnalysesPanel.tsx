
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Trash2, Edit3, Plus, Tag, FileText, Share2 } from "lucide-react";
import { useSavedAnalysesUnified } from "@/hooks/useSavedAnalysesUnified";
import { ShareAnalysisModal } from "./ShareAnalysisModal";
import { toast } from "sonner";
import { exportAnalysesToCSV, exportAnalysesToPrintableHTML } from "@/utils/export";

interface SavedAnalysesPanelProps {
  onLoadAnalysis?: (analysis: any) => void;
}

export function SavedAnalysesPanel({ onLoadAnalysis }: SavedAnalysesPanelProps) {
  const { savedAnalyses, deleteAnalysis, updateAnalysis, isLoading } = useSavedAnalysesUnified();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedAnalysisForShare, setSelectedAnalysisForShare] = useState<any>(null);

  const handleEdit = (analysis: any) => {
    setEditingId(analysis.id);
    setEditTags(analysis.tags?.join(", ") || "");
    setEditNotes(analysis.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      const tags = editTags.split(",").map(tag => tag.trim()).filter(Boolean);
      await updateAnalysis({
        id: editingId,
        tags,
        notes: editNotes
      });
      setEditingId(null);
      toast.success("Analysis updated successfully!");
    } catch (error) {
      toast.error("Failed to update analysis");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this analysis?")) {
      try {
        await deleteAnalysis(id);
        toast.success("Analysis deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete analysis");
      }
    }
  };

  const handleShare = (analysis: any) => {
    setSelectedAnalysisForShare(analysis);
    setShareModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-gray-500" />
          <span className="text-gray-500">Loading saved analyses...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Saved Analyses</h3>
          <Badge variant="secondary" className="ml-auto">
            {savedAnalyses.length}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportAnalysesToCSV(savedAnalyses)}
            title="Export as CSV"
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportAnalysesToPrintableHTML(savedAnalyses, 'Saved Analyses Report')}
            title="Export as PDF"
          >
            Export PDF
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {savedAnalyses.length === 0 ? (
            <p className="text-gray-500 text-sm">No saved analyses yet.</p>
          ) : (
            savedAnalyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{analysis.occupation_title}</h4>
                    <p className="text-xs text-gray-500">Code: {analysis.occupation_code}</p>
                  </div>
                  <div className="flex gap-1">
                    {onLoadAnalysis && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLoadAnalysis(analysis)}
                        title="Load analysis"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(analysis)}
                      title="Share analysis"
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(analysis)}
                          title="Edit analysis"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Analysis</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              Tags (comma-separated)
                            </label>
                            <Input
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
                              placeholder="e.g., healthcare, high-demand, remote-friendly"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Notes
                            </label>
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add your personal notes about this occupation..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="flex-1">
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(analysis.id)}
                      title="Delete analysis"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {analysis.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {analysis.notes && (
                  <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                    {analysis.notes}
                  </p>
                )}

                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Saved {new Date(analysis.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {selectedAnalysisForShare && (
        <ShareAnalysisModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedAnalysisForShare(null);
          }}
          analysisId={selectedAnalysisForShare.id}
          occupationTitle={selectedAnalysisForShare.occupation_title}
        />
      )}
    </>
  );
}
