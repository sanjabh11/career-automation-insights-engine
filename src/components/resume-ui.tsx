import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

export type ResumeProofConfidence = 'low' | 'medium' | 'high';

export interface ResumeProofEvidenceCard {
    id: string;
    claim: string;
    sourceIds: string[];
    confidence: ResumeProofConfidence | string;
    generatedAt: string;
    caveat: string;
    doesNotProve: string;
    reviewStatus: string;
}

export interface ResumeServerParserReceipt {
    receiptId: string;
    generatedAt: string;
    filename: string;
    filenameHash: string;
    fileSha256: string;
    byteLength: number;
    declaredMimeType: string;
    detectedFileKind: string;
    accepted: boolean;
    extractedTextAvailable: boolean;
    inputMode: string;
    rawFileStored: boolean;
    rawResumeTextStored: boolean;
    productionPdfDocxParser: boolean;
    tempFileDeletionStatus: string;
    deletionStatus: string;
    validationControls: string[];
    sourceIds: string[];
    caveat: string;
    doesNotProve: string;
}

export interface ResumeParserBoundary {
    filename: string;
    inputMode: string;
    serverParserReceiptId?: string | null;
    fileSha256?: string | null;
    detectedFileKind?: string;
    uploadValidation?: string;
    rawFileStored: boolean;
    rawResumeTextStored: boolean;
    savedAnalysisId: string | null;
    deletionReceiptAvailable: boolean;
    productionPdfDocxParser: boolean;
    tempFileDeletionStatus?: string;
    caveat: string;
}

export interface ResumeProofPack {
    proofPackType: string;
    schemaVersion?: string;
    generatedAt: string;
    reviewStatus: string;
    sourceIds: string[];
    evidenceCards: ResumeProofEvidenceCard[];
    parserBoundary?: ResumeParserBoundary;
    decisionBoundaries: string[];
}

const REVIEW_STATUS_LABELS: Record<string, string> = {
    auto_generated: 'Auto-generated',
    staff_review_required: 'Staff review required',
    staff_reviewed: 'Staff reviewed',
    coach_reviewed: 'Coach reviewed',
    client_ready: 'Client ready',
};

export function formatReviewStatus(status?: string): string {
    if (!status) return 'Review status unknown';
    return REVIEW_STATUS_LABELS[status] || status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function formatConfidence(confidence?: string): string {
    if (!confidence) return 'Unknown confidence';
    return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
}

export function findResumeEvidenceCard(proofPack: ResumeProofPack | undefined, id: string): ResumeProofEvidenceCard | undefined {
    return proofPack?.evidenceCards.find((card) => card.id === id);
}

export function ResumeEvidenceBoundaryNote({ card, label }: { card?: ResumeProofEvidenceCard; label: string }) {
    if (!card) return null;

    return (
        <Alert data-resume-evidence-note={card.id}>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
                <div className="space-y-1">
                    <p>
                        <strong>{label}:</strong> {card.claim}
                    </p>
                    <p>
                        <strong>Sources:</strong> {card.sourceIds.join(', ')}. <strong>{formatConfidence(card.confidence)}.</strong> <strong>Review:</strong> {formatReviewStatus(card.reviewStatus)}.
                    </p>
                    <p>
                        <strong>Caveat:</strong> {card.caveat}
                    </p>
                    <p>
                        <strong>Does not prove:</strong> {card.doesNotProve}
                    </p>
                </div>
            </AlertDescription>
        </Alert>
    );
}

export function getRiskLevel(score: number) {
    if (score < 30) return { label: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score < 60) return { label: 'Moderate Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
}

export function getSeverityColor(severity: string) {
    switch (severity) {
        case 'high': return 'destructive';
        case 'medium': return 'default';
        case 'low': return 'secondary';
        default: return 'outline';
    }
}
