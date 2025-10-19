import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OccupationAnalysis } from "@/components/OccupationAnalysis";
import { useShareAnalysis } from "@/hooks/useShareAnalysis";
import { Share2, Eye, Calendar, User } from "lucide-react";
import { toast } from "sonner";

export default function SharedAnalysisPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { getSharedAnalysis } = useShareAnalysis();

  useEffect(() => {
    if (!shareToken) return;

    const loadSharedAnalysis = async () => {
      try {
        setLoading(true);
        const result = await getSharedAnalysis(shareToken);
        
        if (result?.success && result?.analysis) {
          setAnalysisData(result);
        } else {
          setError(result?.error || 'Analysis not found or access denied');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shared analysis');
        toast.error('Failed to load shared analysis');
      } finally {
        setLoading(false);
      }
    };

    loadSharedAnalysis();
  }, [shareToken, getSharedAnalysis]);

  if (!shareToken) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = analysisData?.analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-6 h-6" />
                Shared Analysis
              </h1>
              <p className="text-gray-600">
                {analysis?.occupation_title} (Code: {analysis?.occupation_code})
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {analysisData?.view_count} views
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Shared {new Date(analysis?.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Analysis Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Occupation</Label>
                  <p className="font-medium">{analysis?.occupation_title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">O*NET Code</Label>
                  <p className="font-medium">{analysis?.occupation_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Analysis Date</Label>
                  <p className="font-medium">
                    {new Date(analysis?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {analysis?.tags && analysis.tags.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-500">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {analysis?.notes && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-gray-700 mt-1">{analysis.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {analysis?.analysis_data && (
          <OccupationAnalysis 
            occupation={analysis.analysis_data}
            overallAPO={analysis.analysis_data?.overallAPO ?? 0}
            onAddToSelected={() => {}}
            isAlreadySelected={true}
          />
        )}
      </div>
    </div>
  );
}
