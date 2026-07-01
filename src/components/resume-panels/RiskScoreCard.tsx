import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import {
  formatReviewStatus,
  ResumeEvidenceBoundaryNote,
  getRiskLevel,
  type ResumeProofEvidenceCard,
} from '@/components/resume-ui';
import type { ResumeDeletionReceipt } from '@/lib/resumeAnalysisPrivacy';
import type {
  ResumeProofReportArtifact,
  ResumeProofReportArtifactDeletionReceipt,
} from '@/lib/resumeProofReportArtifacts';

export interface RiskScoreCardProps {
  automationRiskScore: number;
  confidenceScore: number;
  automationPronePhrasesCount: number;
  riskEvidenceCard: ResumeProofEvidenceCard | null;
  analysisId: string | null;
  deletingAnalysis: boolean;
  deleteSavedAnalysis: () => void;
  deletionReceipt: ResumeDeletionReceipt | null;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  savingProofArtifact: boolean;
  saveRedactedProofArtifact: () => void;
  savedProofArtifact: ResumeProofReportArtifact | null;
  deletingProofArtifact: boolean;
  deleteSavedProofArtifact: () => void;
  proofArtifactDeletionReceipt: ResumeProofReportArtifactDeletionReceipt | null;
}

export function RiskScoreCard(props: RiskScoreCardProps) {
  const {
    automationRiskScore, confidenceScore, automationPronePhrasesCount,
    riskEvidenceCard, analysisId, deletingAnalysis, deleteSavedAnalysis,
    deletionReceipt, isAuthenticated, isSupabaseConfigured,
    savingProofArtifact, saveRedactedProofArtifact, savedProofArtifact,
    deletingProofArtifact, deleteSavedProofArtifact, proofArtifactDeletionReceipt,
  } = props;

  return (
    <Card className="border-2 border-[var(--accent-primary)]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automation Risk Assessment</CardTitle>
            <CardDescription>
              Based on AI analysis of {automationPronePhrasesCount} potential risk indicators
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getRiskLevel(automationRiskScore).color}`}>
              {automationRiskScore}
            </div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Risk Level</span>
            <span className="font-medium">{getRiskLevel(automationRiskScore).label}</span>
          </div>
          <Progress value={automationRiskScore} className="h-3" />
        </div>

        <Badge className={getRiskLevel(automationRiskScore).bgColor} variant="outline">
          Confidence: {Math.round(confidenceScore * 100)}%
        </Badge>

        <ResumeEvidenceBoundaryNote card={riskEvidenceCard} label="Risk score evidence" />

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>
              {analysisId
                ? 'This signed-in analysis is saved to your account. Use delete when the client review is complete.'
                : 'No saved analysis record is available for this result in the current session.'}
            </span>
            {analysisId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deleteSavedAnalysis}
                disabled={deletingAnalysis}
              >
                {deletingAnalysis ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Saved Record
              </Button>
            )}
          </AlertDescription>
        </Alert>

        {deletionReceipt && (
          <Alert data-resume-deletion-receipt="true">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Deletion receipt:</strong> {deletionReceipt.receiptId}</p>
                <p>Saved analysis {deletionReceipt.analysisId} was marked {deletionReceipt.deletionStatus} at {new Date(deletionReceipt.deletedAt).toLocaleString()}.</p>
                <p><strong>Receipt hash:</strong> <code>{deletionReceipt.receiptHash.slice(0, 16)}...</code></p>
                <p>{deletionReceipt.rawTextRetentionPolicy}</p>
                <p>{deletionReceipt.modelProviderBoundary}</p>
                <p><strong>Sources:</strong> {deletionReceipt.sourceIds.join(', ')}. <strong>Caveat:</strong> {deletionReceipt.caveat}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert data-resume-proof-artifact-boundary="true">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>
              Saved proof artifacts are redacted: raw resume text, phrase detail rows, and rewrite detail rows are omitted. Keep the local download for user-controlled detailed review.
              {!isAuthenticated && ' Sign in to save a redacted proof artifact.'}
              {isAuthenticated && !isSupabaseConfigured && ' Supabase is not configured, so saving is unavailable in this environment.'}
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void saveRedactedProofArtifact()}
                disabled={savingProofArtifact || !isAuthenticated || !isSupabaseConfigured}
              >
                {savingProofArtifact ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Save Redacted Artifact
              </Button>
              {savedProofArtifact && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void deleteSavedProofArtifact()}
                  disabled={deletingProofArtifact}
                >
                  {deletingProofArtifact ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Artifact
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {savedProofArtifact && (
          <Alert data-resume-proof-artifact-status="true">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Saved redacted artifact:</strong> {savedProofArtifact.id.slice(0, 8)}.</p>
                <p><strong>Review:</strong> {formatReviewStatus(savedProofArtifact.reviewStatus)}. <strong>Sources:</strong> {savedProofArtifact.sourceIds.join(', ')}.</p>
                <p>{savedProofArtifact.retentionPolicy}</p>
                <p><strong>Caveat:</strong> {savedProofArtifact.caveat}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {proofArtifactDeletionReceipt && (
          <Alert data-resume-proof-artifact-deletion-receipt="true">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Artifact deletion receipt:</strong> {proofArtifactDeletionReceipt.receiptId}</p>
                <p>Artifact {proofArtifactDeletionReceipt.artifactId} was marked {proofArtifactDeletionReceipt.deletionStatus} at {new Date(proofArtifactDeletionReceipt.deletedAt).toLocaleString()}.</p>
                <p><strong>Receipt hash:</strong> <code>{proofArtifactDeletionReceipt.receiptHash.slice(0, 16)}...</code></p>
                <p>{proofArtifactDeletionReceipt.caveat}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
