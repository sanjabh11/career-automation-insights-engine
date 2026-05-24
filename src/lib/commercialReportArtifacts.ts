import { supabase } from "@/integrations/supabase/client";
import type { ReportReviewStatus } from "@/lib/reportEvidenceCards";

export interface CommercialReportArtifactInput {
  artifactType: string;
  title: string;
  reportHtml: string;
  buyerSegment?: string;
  reportType?: string;
  occupationSlug?: string;
  occupationTitle?: string;
  occupationCode?: string;
  sourceVersions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CommercialReportArtifact {
  id: string;
  artifactType: string;
  title: string;
  createdAt: string;
}

export interface CommercialReportArtifactDetail extends CommercialReportArtifact {
  buyerSegment: string;
  reportType: string;
  occupationSlug: string | null;
  occupationTitle: string | null;
  occupationCode: string | null;
  reportHtml: string;
  sourceVersions: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export type CommercialReportArtifactEventType =
  | "staff_opened"
  | "staff_downloaded"
  | "staff_open_failed"
  | "section_review_updated"
  | "section_client_ready"
  | "artifact_client_ready";

export interface CommercialReportArtifactEventInput {
  artifactId: string;
  eventType: CommercialReportArtifactEventType;
  leadId?: string | null;
  deliveryChannel?: string;
  metadata?: Record<string, unknown>;
}

export interface CommercialReportArtifactEvent {
  id: string;
  artifactId: string;
  leadId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  eventType: CommercialReportArtifactEventType;
  deliveryChannel?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ProofPackReviewAttestationSection {
  sectionId: string;
  sectionTitle: string;
  reviewStatus: ReportReviewStatus;
  clientReady: boolean;
  requiredForInstitutionalDelivery: boolean;
  acceptanceCriteria: string[];
  sourceIds: string[];
  evidenceCardIds: string[];
}

export interface ProofPackReviewAttestationInput {
  artifactId: string;
  leadId: string;
  leadEmail: string;
  reviewerUserId?: string | null;
  reviewerEmail?: string | null;
  staffNote?: string | null;
  workflow: {
    reviewStatus?: ReportReviewStatus;
    clientReady?: boolean;
    pendingSectionCount?: number;
    sections: ProofPackReviewAttestationSection[];
  };
  generatedAt?: string;
}

export interface ProofPackReviewAttestation {
  attestationId: string;
  attestationType: "human_review_attestation";
  generatedAt: string;
  artifactId: string;
  leadId: string;
  leadEmail: string;
  reviewerUserId: string | null;
  reviewerEmail: string | null;
  staffNote: string | null;
  reviewStatus: "client_ready";
  sectionCount: number;
  clientReadySectionCount: number;
  pendingSectionCount: number;
  sourceIds: string[];
  evidenceCardIds: string[];
  sectionStatuses: Array<{
    sectionId: string;
    sectionTitle: string;
    reviewStatus: ReportReviewStatus;
    clientReady: boolean;
    acceptanceCriteria: string[];
  }>;
  decisionBoundaries: string[];
  governanceSourceIds: string[];
  snapshotHash: string;
  legalSignature: false;
  caveat: string;
}

interface CommercialReportArtifactRpcRow {
  id: string;
  artifact_type: string;
  title: string;
  created_at: string;
}

interface CommercialReportArtifactDetailRpcRow extends CommercialReportArtifactRpcRow {
  buyer_segment: string;
  report_type: string;
  occupation_slug: string | null;
  occupation_title: string | null;
  occupation_code: string | null;
  report_html: string;
  source_versions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

interface CommercialReportArtifactEventRpcRow {
  id: string;
  artifact_id: string;
  lead_id?: string | null;
  actor_user_id?: string | null;
  actor_email?: string | null;
  event_type: CommercialReportArtifactEventType;
  delivery_channel?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface SupabaseRpcError {
  message?: string;
}

type RpcResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseRpcError | null;
}>;

interface CommercialReportArtifactRpcClient {
  rpc(
    functionName: "create_commercial_report_artifact",
    args: {
      p_artifact_type: string;
      p_title: string;
      p_report_html: string;
      p_buyer_segment: string;
      p_report_type: string;
      p_occupation_slug: string | null;
      p_occupation_title: string | null;
      p_occupation_code: string | null;
      p_source_versions: Record<string, unknown>;
      p_metadata: Record<string, unknown>;
    }
  ): RpcResult<CommercialReportArtifactRpcRow[]>;
  rpc(
    functionName: "get_commercial_report_artifact",
    args: {
      p_artifact_id: string;
    }
  ): RpcResult<CommercialReportArtifactDetailRpcRow[]>;
  rpc(
    functionName: "log_commercial_report_artifact_event",
    args: {
      p_artifact_id: string;
      p_event_type: CommercialReportArtifactEventType;
      p_lead_id: string | null;
      p_delivery_channel: string;
      p_metadata: Record<string, unknown>;
    }
  ): RpcResult<CommercialReportArtifactEventRpcRow[]>;
  rpc(
    functionName: "get_commercial_report_artifact_events",
    args: {
      p_artifact_id: string;
      p_limit: number;
    }
  ): RpcResult<CommercialReportArtifactEventRpcRow[]>;
}

const artifactClient = supabase as unknown as CommercialReportArtifactRpcClient;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

async function sha256Hex(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `fallback-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

export async function buildProofPackReviewAttestation(
  input: ProofPackReviewAttestationInput
): Promise<ProofPackReviewAttestation> {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sections = input.workflow.sections.map((section) => ({
    sectionId: section.sectionId,
    sectionTitle: section.sectionTitle,
    reviewStatus: section.reviewStatus,
    clientReady: section.clientReady,
    requiredForInstitutionalDelivery: section.requiredForInstitutionalDelivery,
    acceptanceCriteria: section.acceptanceCriteria,
    sourceIds: section.sourceIds,
    evidenceCardIds: section.evidenceCardIds,
  }));
  const pendingSectionCount = sections.filter((section) => !section.clientReady).length;
  const snapshot = {
    artifactId: input.artifactId,
    leadId: input.leadId,
    leadEmail: input.leadEmail,
    reviewerUserId: input.reviewerUserId || null,
    reviewerEmail: input.reviewerEmail || null,
    generatedAt,
    sections,
  };
  const snapshotHash = await sha256Hex(stableStringify(snapshot));

  return {
    attestationId: `ppra_${generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}_${snapshotHash.slice(0, 12)}`,
    attestationType: "human_review_attestation",
    generatedAt,
    artifactId: input.artifactId,
    leadId: input.leadId,
    leadEmail: input.leadEmail,
    reviewerUserId: input.reviewerUserId || null,
    reviewerEmail: input.reviewerEmail || null,
    staffNote: input.staffNote?.trim() || null,
    reviewStatus: "client_ready",
    sectionCount: sections.length,
    clientReadySectionCount: sections.length - pendingSectionCount,
    pendingSectionCount,
    sourceIds: uniqueSorted(sections.flatMap((section) => section.sourceIds)),
    evidenceCardIds: uniqueSorted(sections.flatMap((section) => section.evidenceCardIds)),
    sectionStatuses: sections.map((section) => ({
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      reviewStatus: section.reviewStatus,
      clientReady: section.clientReady,
      acceptanceCriteria: section.acceptanceCriteria,
    })),
    decisionBoundaries: [
      "Planning artifact only; not a hiring, firing, promotion, compensation, or layoff decision system.",
      "Client-ready means the listed proof-pack sections were reviewed for this artifact, not that labor-market outcomes are certified.",
      "Accessibility, accommodation, adverse-impact, legal, and labor-relations review remain customer-specific responsibilities.",
    ],
    governanceSourceIds: ["nist-ai-rmf", "iso-42001", "ada-ai-hiring-guidance", "wcag-22"],
    snapshotHash,
    legalSignature: false,
    caveat: "This is a non-legal human review attestation for proof-pack delivery traceability; it is not an electronic signature, compliance certification, or employment-selection validation.",
  };
}

function normalizeArtifact(row: CommercialReportArtifactRpcRow): CommercialReportArtifact {
  return {
    id: row.id,
    artifactType: row.artifact_type,
    title: row.title,
    createdAt: row.created_at,
  };
}

function normalizeArtifactDetail(row: CommercialReportArtifactDetailRpcRow): CommercialReportArtifactDetail {
  return {
    ...normalizeArtifact(row),
    buyerSegment: row.buyer_segment,
    reportType: row.report_type,
    occupationSlug: row.occupation_slug,
    occupationTitle: row.occupation_title,
    occupationCode: row.occupation_code,
    reportHtml: row.report_html,
    sourceVersions: row.source_versions || {},
    metadata: row.metadata || {},
  };
}

function normalizeArtifactEvent(row: CommercialReportArtifactEventRpcRow): CommercialReportArtifactEvent {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    leadId: row.lead_id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    eventType: row.event_type,
    deliveryChannel: row.delivery_channel,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

export async function createCommercialReportArtifact(
  input: CommercialReportArtifactInput
): Promise<CommercialReportArtifact> {
  const { data, error } = await artifactClient.rpc("create_commercial_report_artifact", {
    p_artifact_type: input.artifactType,
    p_title: input.title,
    p_report_html: input.reportHtml,
    p_buyer_segment: input.buyerSegment || "unknown",
    p_report_type: input.reportType || "unknown",
    p_occupation_slug: input.occupationSlug || null,
    p_occupation_title: input.occupationTitle || null,
    p_occupation_code: input.occupationCode || null,
    p_source_versions: input.sourceVersions || {},
    p_metadata: input.metadata || {},
  });

  if (error) {
    throw new Error(error.message || "Unable to create report artifact.");
  }

  const artifact = data?.[0];
  if (!artifact) {
    throw new Error("Report artifact creation returned no ID.");
  }

  return normalizeArtifact(artifact);
}

export async function getCommercialReportArtifact(artifactId: string): Promise<CommercialReportArtifactDetail> {
  const { data, error } = await artifactClient.rpc("get_commercial_report_artifact", {
    p_artifact_id: artifactId,
  });

  if (error) {
    throw new Error(error.message || "Unable to load report artifact.");
  }

  const artifact = data?.[0];
  if (!artifact) {
    throw new Error("Report artifact was not found.");
  }

  return normalizeArtifactDetail(artifact);
}

export async function logCommercialReportArtifactEvent(
  input: CommercialReportArtifactEventInput
): Promise<CommercialReportArtifactEvent> {
  const { data, error } = await artifactClient.rpc("log_commercial_report_artifact_event", {
    p_artifact_id: input.artifactId,
    p_event_type: input.eventType,
    p_lead_id: input.leadId || null,
    p_delivery_channel: input.deliveryChannel || "lead-ops",
    p_metadata: input.metadata || {},
  });

  if (error) {
    throw new Error(error.message || "Unable to log report artifact event.");
  }

  const event = data?.[0];
  if (!event) {
    throw new Error("Report artifact event log returned no row.");
  }

  return normalizeArtifactEvent(event);
}

export async function listCommercialReportArtifactEvents(
  artifactId: string,
  limit = 20
): Promise<CommercialReportArtifactEvent[]> {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
  const { data, error } = await artifactClient.rpc("get_commercial_report_artifact_events", {
    p_artifact_id: artifactId,
    p_limit: boundedLimit,
  });

  if (error) {
    throw new Error(error.message || "Unable to load report artifact event history.");
  }

  return (data || []).map(normalizeArtifactEvent);
}
