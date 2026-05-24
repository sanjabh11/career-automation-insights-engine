import { supabase } from "@/integrations/supabase/client";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "archived"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface CommercialLeadRow {
  id: string;
  email: string;
  source: string;
  buyer_segment: string;
  report_type: string;
  report_artifact_id: string | null;
  occupation_slug: string | null;
  occupation_title: string | null;
  risk_score: number | null;
  status: LeadStatus;
  staff_notes: string | null;
  last_contacted_at: string | null;
  consent_to_contact: boolean;
  consent_text: string | null;
  consent_captured_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface LeadOpsSummary {
  total: number;
  newLeads: number;
  coachLeads: number;
  workforceLeads: number;
  qualifiedOrConverted: number;
  averageRiskScore: number | null;
}

interface SupabaseRpcError {
  message?: string;
}

type RpcResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseRpcError | null;
}>;

interface CommercialLeadOpsRpcClient {
  rpc(functionName: "get_commercial_leads", args: { p_limit: number }): RpcResult<CommercialLeadRow[]>;
  rpc(
    functionName: "update_commercial_lead_status",
    args: {
      p_lead_id: string;
      p_status: LeadStatus;
      p_staff_notes: string | null;
    }
  ): RpcResult<CommercialLeadRow[]>;
}

const commercialLeadOpsClient = supabase as unknown as CommercialLeadOpsRpcClient;

function isCoachSegment(segment: string): boolean {
  return ["coach", "career-coach", "career_coach"].includes(segment);
}

function isWorkforceSegment(segment: string): boolean {
  return ["workforce", "workforce-leader", "workforce_leader", "enterprise"].includes(segment);
}

export async function fetchCommercialLeads(limit = 100): Promise<CommercialLeadRow[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const { data, error } = await commercialLeadOpsClient.rpc("get_commercial_leads", {
    p_limit: boundedLimit,
  });

  if (error) {
    throw new Error(error.message || "Unable to load commercial leads.");
  }

  return data ?? [];
}

export async function updateCommercialLeadStatus(input: {
  leadId: string;
  status: LeadStatus;
  staffNotes?: string;
}): Promise<CommercialLeadRow> {
  const { data, error } = await commercialLeadOpsClient.rpc("update_commercial_lead_status", {
    p_lead_id: input.leadId,
    p_status: input.status,
    p_staff_notes: input.staffNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Unable to update commercial lead.");
  }

  const updatedLead = data?.[0];
  if (!updatedLead) {
    throw new Error("Commercial lead update returned no row.");
  }

  return updatedLead;
}

export function summarizeCommercialLeads(rows: CommercialLeadRow[]): LeadOpsSummary {
  const scoredRows = rows.filter((row) => typeof row.risk_score === "number");
  const riskTotal = scoredRows.reduce((sum, row) => sum + (row.risk_score ?? 0), 0);

  return {
    total: rows.length,
    newLeads: rows.filter((row) => row.status === "new").length,
    coachLeads: rows.filter((row) => isCoachSegment(row.buyer_segment)).length,
    workforceLeads: rows.filter((row) => isWorkforceSegment(row.buyer_segment)).length,
    qualifiedOrConverted: rows.filter((row) => row.status === "qualified" || row.status === "converted").length,
    averageRiskScore: scoredRows.length ? Math.round((riskTotal / scoredRows.length) * 10) / 10 : null,
  };
}

const csvHeaders = [
  "created_at",
  "email",
  "source",
  "buyer_segment",
  "report_type",
  "report_artifact_id",
  "occupation_title",
  "occupation_slug",
  "risk_score",
  "status",
  "consent_to_contact",
  "consent_captured_at",
  "last_contacted_at",
  "staff_notes",
];

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCommercialLeadCsv(rows: CommercialLeadRow[]): string {
  const body = rows.map((row) =>
    [
      row.created_at,
      row.email,
      row.source,
      row.buyer_segment,
      row.report_type,
      row.report_artifact_id,
      row.occupation_title,
      row.occupation_slug,
      row.risk_score,
      row.status,
      row.consent_to_contact ? "yes" : "no",
      row.consent_captured_at,
      row.last_contacted_at,
      row.staff_notes,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [csvHeaders.join(","), ...body].join("\n");
}
