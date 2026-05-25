import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface ResumeProofReportArtifactInput {
  analysisId?: string | null;
  title: string;
  reportHtmlRedacted: string;
  sourceVersions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ResumeProofReportArtifact {
  id: string;
  analysisId: string | null;
  title: string;
  reviewStatus: string;
  rawResumeTextStored: boolean;
  resumeDetailRowsRedacted: boolean;
  retentionPolicy: string;
  sourceIds: string[];
  caveat: string;
  createdAt: string;
}

export interface ResumeProofReportArtifactDeletionReceipt {
  receiptId: string;
  artifactId: string;
  titleHash: string;
  deletionScope: string;
  deletionStatus: 'deleted' | 'not_found_or_not_owned';
  sourceIds: string[];
  caveat: string;
  receiptHash: string;
  requestedAt: string;
  deletedAt: string;
}

interface ResumeProofReportArtifactRpcRow {
  id: string;
  analysis_id: string | null;
  title: string;
  review_status: string;
  raw_resume_text_stored: boolean;
  resume_detail_rows_redacted: boolean;
  retention_policy: string;
  source_ids: string[];
  caveat: string;
  created_at: string;
}

interface ResumeProofReportArtifactDeletionReceiptRpcRow {
  receipt_id: string;
  artifact_id: string;
  title_hash: string;
  deletion_scope: string;
  deletion_status: 'deleted' | 'not_found_or_not_owned';
  source_ids: string[];
  caveat: string;
  receipt_hash: string;
  requested_at: string;
  deleted_at: string;
}

interface SupabaseRpcError {
  message?: string;
}

type RpcResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseRpcError | null;
}>;

interface ResumeProofReportArtifactRpcClient {
  rpc(
    functionName: 'create_resume_proof_report_artifact',
    args: {
      p_analysis_id: string | null;
      p_title: string;
      p_report_html_redacted: string;
      p_source_versions: Record<string, unknown>;
      p_metadata: Record<string, unknown>;
    }
  ): RpcResult<ResumeProofReportArtifactRpcRow[]>;
  rpc(
    functionName: 'delete_resume_proof_report_artifact_with_receipt',
    args: {
      p_artifact_id: string;
    }
  ): RpcResult<ResumeProofReportArtifactDeletionReceiptRpcRow[]>;
}

const resumeProofReportArtifactClient = supabase as unknown as ResumeProofReportArtifactRpcClient;

function mapResumeProofReportArtifact(row: ResumeProofReportArtifactRpcRow): ResumeProofReportArtifact {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    title: row.title,
    reviewStatus: row.review_status,
    rawResumeTextStored: row.raw_resume_text_stored,
    resumeDetailRowsRedacted: row.resume_detail_rows_redacted,
    retentionPolicy: row.retention_policy,
    sourceIds: row.source_ids || [],
    caveat: row.caveat,
    createdAt: row.created_at,
  };
}

function mapResumeProofReportArtifactDeletionReceipt(
  row: ResumeProofReportArtifactDeletionReceiptRpcRow
): ResumeProofReportArtifactDeletionReceipt {
  return {
    receiptId: row.receipt_id,
    artifactId: row.artifact_id,
    titleHash: row.title_hash,
    deletionScope: row.deletion_scope,
    deletionStatus: row.deletion_status,
    sourceIds: row.source_ids || [],
    caveat: row.caveat,
    receiptHash: row.receipt_hash,
    requestedAt: row.requested_at,
    deletedAt: row.deleted_at,
  };
}

export async function createResumeProofReportArtifact(
  input: ResumeProofReportArtifactInput
): Promise<ResumeProofReportArtifact> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase resume proof-report artifact storage is not configured in this environment.');
  }

  const { data, error } = await resumeProofReportArtifactClient.rpc('create_resume_proof_report_artifact', {
    p_analysis_id: input.analysisId || null,
    p_title: input.title,
    p_report_html_redacted: input.reportHtmlRedacted,
    p_source_versions: input.sourceVersions || {},
    p_metadata: input.metadata || {},
  });

  if (error) {
    throw new Error(error.message || 'Unable to save redacted resume proof-report artifact.');
  }

  const [artifact] = data || [];
  if (!artifact) {
    throw new Error('Resume proof-report artifact creation returned no ID.');
  }

  return mapResumeProofReportArtifact(artifact);
}

export async function deleteResumeProofReportArtifactWithReceipt(
  artifactId: string
): Promise<ResumeProofReportArtifactDeletionReceipt> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase resume proof-report artifact storage is not configured in this environment.');
  }

  const { data, error } = await resumeProofReportArtifactClient.rpc('delete_resume_proof_report_artifact_with_receipt', {
    p_artifact_id: artifactId,
  });

  if (error) {
    throw new Error(error.message || 'Unable to delete redacted resume proof-report artifact.');
  }

  const [receipt] = data || [];
  if (!receipt) {
    throw new Error('Resume proof-report artifact deletion receipt was not returned.');
  }

  return mapResumeProofReportArtifactDeletionReceipt(receipt);
}
