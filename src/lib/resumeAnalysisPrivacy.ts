import { supabase } from '@/lib/supabase';

export interface ResumeDeletionReceipt {
  receiptId: string;
  analysisId: string;
  filename: string | null;
  filenameHash: string;
  deletionScope: string;
  deletionStatus: 'deleted' | 'not_found_or_not_owned';
  rawTextRetentionPolicy: string;
  modelProviderBoundary: string;
  sourceIds: string[];
  caveat: string;
  receiptHash: string;
  requestedAt: string;
  deletedAt: string;
}

interface ResumeDeletionReceiptRpcRow {
  receipt_id: string;
  analysis_id: string;
  filename: string | null;
  filename_hash: string;
  deletion_scope: string;
  deletion_status: 'deleted' | 'not_found_or_not_owned';
  raw_text_retention_policy: string;
  model_provider_boundary: string;
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

interface ResumeAnalysisPrivacyRpcClient {
  rpc(
    functionName: 'delete_resume_analysis_with_receipt',
    args: { p_analysis_id: string }
  ): RpcResult<ResumeDeletionReceiptRpcRow[]>;
}

const resumePrivacyClient = supabase as unknown as ResumeAnalysisPrivacyRpcClient;

function mapResumeDeletionReceipt(row: ResumeDeletionReceiptRpcRow): ResumeDeletionReceipt {
  return {
    receiptId: row.receipt_id,
    analysisId: row.analysis_id,
    filename: row.filename,
    filenameHash: row.filename_hash,
    deletionScope: row.deletion_scope,
    deletionStatus: row.deletion_status,
    rawTextRetentionPolicy: row.raw_text_retention_policy,
    modelProviderBoundary: row.model_provider_boundary,
    sourceIds: row.source_ids || [],
    caveat: row.caveat,
    receiptHash: row.receipt_hash,
    requestedAt: row.requested_at,
    deletedAt: row.deleted_at,
  };
}

export async function deleteResumeAnalysisWithReceipt(analysisId: string): Promise<ResumeDeletionReceipt> {
  const { data, error } = await resumePrivacyClient.rpc('delete_resume_analysis_with_receipt', {
    p_analysis_id: analysisId,
  });

  if (error) {
    throw new Error(error.message || 'Unable to delete saved resume analysis.');
  }

  const [receipt] = data || [];
  if (!receipt) {
    throw new Error('Resume deletion receipt was not returned.');
  }

  return mapResumeDeletionReceipt(receipt);
}
