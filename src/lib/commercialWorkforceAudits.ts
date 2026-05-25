import { supabase } from "@/integrations/supabase/client";

export interface WorkforceAuditRowPayload {
  id?: string;
  department: string;
  role: string;
  headcount: number;
  avgSalary: number;
  apoScore: number;
  socCode?: string;
  reviewStatus?: WorkforceAuditReviewStatus;
  reviewNotes?: string;
  reviewedAt?: string | null;
}

export type WorkforceAuditReviewStatus = "pending" | "mapped" | "reviewed" | "unable_to_map";

export interface WorkforceAuditSummaryPayload {
  totalHeadcount: number;
  weightedExposure: number;
  highRiskHeadcount: number;
  highRiskPayroll: number;
  mappedRows: number;
  unmappedRows: number;
}

export interface CommercialWorkforceAuditRecord {
  id: string;
  orgId: string;
  fileName: string;
  sourceCsv: string;
  rowCount: number;
  summary: WorkforceAuditSummaryPayload;
  sourceVersions: Record<string, unknown>;
  rows: WorkforceAuditRowPayload[];
  createdAt: string;
  updatedAt: string;
}

interface CommercialWorkforceAuditRpcRow {
  id: string;
  org_id: string;
  file_name: string;
  source_csv: string | null;
  row_count: number;
  total_headcount: number;
  weighted_exposure: number | string;
  high_risk_headcount: number;
  high_risk_payroll: number | string;
  mapped_rows: number;
  unmapped_rows: number;
  source_versions: Record<string, unknown> | null;
  rows: unknown;
  created_at: string;
  updated_at: string;
}

interface CommercialWorkforceReviewRpcRow {
  id: string;
  audit_id: string;
  audit_file_name: string;
  org_id: string;
  department: string;
  role: string;
  headcount: number;
  avg_salary: number | string;
  apo_score: number | string;
  soc_code: string | null;
  review_status: WorkforceAuditReviewStatus;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CommercialWorkforceReviewRow {
  id: string;
  auditId: string;
  auditFileName: string;
  orgId: string;
  department: string;
  role: string;
  headcount: number;
  avgSalary: number;
  apoScore: number;
  socCode: string | null;
  reviewStatus: WorkforceAuditReviewStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface SupabaseRpcError {
  message?: string;
}

type RpcResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseRpcError | null;
}>;

interface CommercialWorkforceAuditRpcClient {
  rpc(
    functionName: "create_commercial_workforce_audit",
    args: {
      p_org_id: string;
      p_file_name: string;
      p_source_csv: string;
      p_summary: WorkforceAuditSummaryPayload;
      p_rows: WorkforceAuditRowPayload[];
      p_source_versions: Record<string, unknown>;
    }
  ): RpcResult<CommercialWorkforceAuditRpcRow[]>;
  rpc(functionName: "list_commercial_workforce_audits", args: { p_limit: number }): RpcResult<CommercialWorkforceAuditRpcRow[]>;
  rpc(functionName: "get_commercial_workforce_audit", args: { p_audit_id: string }): RpcResult<CommercialWorkforceAuditRpcRow[]>;
  rpc(
    functionName: "list_commercial_workforce_review_rows",
    args: { p_audit_id: string | null; p_limit: number }
  ): RpcResult<CommercialWorkforceReviewRpcRow[]>;
  rpc(
    functionName: "update_commercial_workforce_row_mapping",
    args: {
      p_row_id: string;
      p_soc_code: string;
      p_review_status: WorkforceAuditReviewStatus;
      p_review_notes: string | null;
    }
  ): RpcResult<CommercialWorkforceReviewRpcRow[]>;
}

const commercialWorkforceAuditClient = supabase as unknown as CommercialWorkforceAuditRpcClient;

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function normalizeRows(value: unknown): WorkforceAuditRowPayload[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const department = String(row.department || "").trim();
      const role = String(row.role || "").trim();
      if (!department || !role) return null;

      return {
        id: typeof row.id === "string" ? row.id : undefined,
        department,
        role,
        headcount: toNumber(row.headcount as number | string | null | undefined),
        avgSalary: toNumber(row.avgSalary as number | string | null | undefined),
        apoScore: toNumber(row.apoScore as number | string | null | undefined),
        socCode: typeof row.socCode === "string" && row.socCode.trim() ? row.socCode.trim() : undefined,
        reviewStatus: isReviewStatus(row.reviewStatus) ? row.reviewStatus : undefined,
        reviewNotes: typeof row.reviewNotes === "string" ? row.reviewNotes : undefined,
        reviewedAt: typeof row.reviewedAt === "string" ? row.reviewedAt : null,
      };
    })
    .filter((row): row is WorkforceAuditRowPayload => row !== null);
}

function isReviewStatus(value: unknown): value is WorkforceAuditReviewStatus {
  return value === "pending" || value === "mapped" || value === "reviewed" || value === "unable_to_map";
}

function normalizeRecord(row: CommercialWorkforceAuditRpcRow): CommercialWorkforceAuditRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    fileName: row.file_name,
    sourceCsv: row.source_csv || "",
    rowCount: row.row_count,
    summary: {
      totalHeadcount: row.total_headcount,
      weightedExposure: toNumber(row.weighted_exposure),
      highRiskHeadcount: row.high_risk_headcount,
      highRiskPayroll: toNumber(row.high_risk_payroll),
      mappedRows: row.mapped_rows,
      unmappedRows: row.unmapped_rows,
    },
    sourceVersions: row.source_versions || {},
    rows: normalizeRows(row.rows),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeReviewRow(row: CommercialWorkforceReviewRpcRow): CommercialWorkforceReviewRow {
  return {
    id: row.id,
    auditId: row.audit_id,
    auditFileName: row.audit_file_name,
    orgId: row.org_id,
    department: row.department,
    role: row.role,
    headcount: row.headcount,
    avgSalary: toNumber(row.avg_salary),
    apoScore: toNumber(row.apo_score),
    socCode: row.soc_code,
    reviewStatus: row.review_status,
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export async function saveCommercialWorkforceAudit(input: {
  orgId: string;
  fileName: string;
  sourceCsv: string;
  summary: WorkforceAuditSummaryPayload;
  rows: WorkforceAuditRowPayload[];
  sourceVersions: Record<string, unknown>;
}): Promise<CommercialWorkforceAuditRecord> {
  const { data, error } = await commercialWorkforceAuditClient.rpc("create_commercial_workforce_audit", {
    p_org_id: input.orgId,
    p_file_name: input.fileName,
    p_source_csv: input.sourceCsv,
    p_summary: input.summary,
    p_rows: input.rows,
    p_source_versions: input.sourceVersions,
  });

  if (error) {
    throw new Error(error.message || "Unable to save workforce audit.");
  }

  const savedRecord = data?.[0];
  if (!savedRecord) {
    throw new Error("Workforce audit save returned no record.");
  }

  return normalizeRecord(savedRecord);
}

export async function listCommercialWorkforceAudits(limit = 20): Promise<CommercialWorkforceAuditRecord[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
  const { data, error } = await commercialWorkforceAuditClient.rpc("list_commercial_workforce_audits", {
    p_limit: boundedLimit,
  });

  if (error) {
    throw new Error(error.message || "Unable to load saved workforce audits.");
  }

  return (data || []).map(normalizeRecord);
}

export async function getCommercialWorkforceAudit(auditId: string): Promise<CommercialWorkforceAuditRecord> {
  const { data, error } = await commercialWorkforceAuditClient.rpc("get_commercial_workforce_audit", {
    p_audit_id: auditId,
  });

  if (error) {
    throw new Error(error.message || "Unable to load workforce audit.");
  }

  const record = data?.[0];
  if (!record) {
    throw new Error("Saved workforce audit was not found.");
  }

  return normalizeRecord(record);
}

export async function listCommercialWorkforceReviewRows(input: {
  auditId?: string | null;
  limit?: number;
} = {}): Promise<CommercialWorkforceReviewRow[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(input.limit ?? 100), 500));
  const { data, error } = await commercialWorkforceAuditClient.rpc("list_commercial_workforce_review_rows", {
    p_audit_id: input.auditId || null,
    p_limit: boundedLimit,
  });

  if (error) {
    throw new Error(error.message || "Unable to load workforce review rows.");
  }

  return (data || []).map(normalizeReviewRow);
}

export async function updateCommercialWorkforceRowMapping(input: {
  rowId: string;
  socCode: string;
  reviewStatus: WorkforceAuditReviewStatus;
  reviewNotes?: string;
}): Promise<CommercialWorkforceReviewRow> {
  const { data, error } = await commercialWorkforceAuditClient.rpc("update_commercial_workforce_row_mapping", {
    p_row_id: input.rowId,
    p_soc_code: input.socCode,
    p_review_status: input.reviewStatus,
    p_review_notes: input.reviewNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Unable to update workforce row mapping.");
  }

  const updatedRow = data?.[0];
  if (!updatedRow) {
    throw new Error("Workforce row mapping update returned no record.");
  }

  return normalizeReviewRow(updatedRow);
}
