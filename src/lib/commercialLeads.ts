import { supabase } from '@/lib/supabase';
import { createCommercialReportArtifact } from '@/lib/commercialReportArtifacts';
import { getReportSourceSnapshot } from '@/lib/reportProvenance';

export interface CommercialLeadInput {
  email: string;
  source: string;
  buyerSegment?: 'career-coach' | 'workforce-leader' | 'individual' | 'unknown';
  reportType?: string;
  occupationSlug?: string;
  occupationTitle?: string;
  riskScore?: number;
  reportHtml?: string;
  consentToContact?: boolean;
  consentText?: string;
  metadata?: Record<string, unknown>;
}

export interface CommercialLeadResult {
  persisted: boolean;
  offlineQueued: boolean;
  artifactPersisted: boolean;
  artifactId?: string;
  leadId?: string;
  error?: string;
  artifactError?: string;
}

interface CommercialLeadPayload {
  email: string;
  source: string;
  buyer_segment: string;
  report_type: string;
  report_artifact_id: string | null;
  occupation_slug: string | null;
  occupation_title: string | null;
  risk_score: number | null;
  report_html: string | null;
  consent_to_contact: boolean;
  consent_text: string | null;
  metadata: Record<string, unknown>;
}

interface QueuedCommercialLeadPayload extends CommercialLeadPayload {
  queued_at: string;
  error?: string;
  retry_count?: number;
  last_retry_at?: string;
}

interface CommercialLeadCaptureRpcRow {
  id: string;
  report_artifact_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseRpcError {
  message?: string;
}

type RpcResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseRpcError | null;
}>;

interface CommercialLeadCaptureRpcClient {
  rpc(
    functionName: 'capture_commercial_lead',
    args: {
      p_email: string;
      p_source: string;
      p_buyer_segment: string;
      p_report_type: string;
      p_report_artifact_id: string | null;
      p_occupation_slug: string | null;
      p_occupation_title: string | null;
      p_risk_score: number | null;
      p_report_html: string | null;
      p_metadata: Record<string, unknown>;
      p_consent_to_contact: boolean;
      p_consent_text: string | null;
    }
  ): RpcResult<CommercialLeadCaptureRpcRow[]>;
}

const OFFLINE_QUEUE_KEY = 'commercial_leads_offline_queue';
const OFFLINE_QUEUE_MAX_ITEMS = 50;
const OFFLINE_QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CommercialLeadQueueFlushResult {
  attempted: number;
  persisted: number;
  remaining: number;
  errors: string[];
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  return utm;
}

function queueOfflineLead(payload: Record<string, unknown>, error?: string) {
  if (typeof localStorage === 'undefined') return;

  const existing = readOfflineLeadQueue();
  existing.push({
    ...sanitizePayloadForOfflineQueue(payload as CommercialLeadPayload),
    queued_at: new Date().toISOString(),
    error,
    retry_count: 0,
  });
  writeOfflineLeadQueue(existing.slice(-OFFLINE_QUEUE_MAX_ITEMS));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Supabase lead capture failed';
}

function readOfflineLeadQueue(): QueuedCommercialLeadPayload[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - OFFLINE_QUEUE_TTL_MS;
    return parsed
      .filter((item): item is QueuedCommercialLeadPayload => {
        if (!item || typeof item !== 'object') return false;
        const row = item as Partial<QueuedCommercialLeadPayload>;
        const queuedAt = row.queued_at ? Date.parse(row.queued_at) : Number.NaN;
        return (
          typeof row.email === 'string' &&
          typeof row.source === 'string' &&
          typeof row.buyer_segment === 'string' &&
          typeof row.report_type === 'string' &&
          Number.isFinite(queuedAt) &&
          queuedAt >= cutoff
        );
      })
      .slice(-OFFLINE_QUEUE_MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeOfflineLeadQueue(queue: QueuedCommercialLeadPayload[]) {
  if (typeof localStorage === 'undefined') return;

  if (queue.length === 0) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return;
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-OFFLINE_QUEUE_MAX_ITEMS)));
}

function sanitizePayloadForOfflineQueue(payload: CommercialLeadPayload): CommercialLeadPayload {
  return {
    ...payload,
    report_html: null,
    metadata: {
      ...payload.metadata,
      offline_queue_redacted_report_html: Boolean(payload.report_html),
      offline_queue_redacted_at: new Date().toISOString(),
    },
  };
}

async function persistCommercialLeadPayload(
  payload: CommercialLeadPayload
): Promise<CommercialLeadCaptureRpcRow | undefined> {
  const client = supabase as unknown as CommercialLeadCaptureRpcClient;
  const { data, error } = await client.rpc('capture_commercial_lead', {
    p_email: payload.email,
    p_source: payload.source,
    p_buyer_segment: payload.buyer_segment,
    p_report_type: payload.report_type,
    p_report_artifact_id: payload.report_artifact_id,
    p_occupation_slug: payload.occupation_slug,
    p_occupation_title: payload.occupation_title,
    p_risk_score: payload.risk_score,
    p_report_html: payload.report_html,
    p_metadata: payload.metadata,
    p_consent_to_contact: payload.consent_to_contact,
    p_consent_text: payload.consent_text,
  });
  if (error) throw error;
  return data?.[0];
}

export function getQueuedCommercialLeadCount(): number {
  return readOfflineLeadQueue().length;
}

export async function flushQueuedCommercialLeads(limit = 10): Promise<CommercialLeadQueueFlushResult> {
  const queue = readOfflineLeadQueue();
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), OFFLINE_QUEUE_MAX_ITEMS));
  const retryNow = queue.slice(0, boundedLimit);
  const untouched = queue.slice(boundedLimit);
  const failed: QueuedCommercialLeadPayload[] = [];
  const errors: string[] = [];
  let persisted = 0;

  for (const queued of retryNow) {
    const {
      queued_at: _queuedAt,
      error: _queuedError,
      retry_count: retryCount = 0,
      last_retry_at: _lastRetryAt,
      ...payload
    } = queued;

    try {
      await persistCommercialLeadPayload(payload);
      persisted += 1;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      errors.push(message);
      failed.push({
        ...queued,
        error: message,
        retry_count: retryCount + 1,
        last_retry_at: new Date().toISOString(),
      });
    }
  }

  const nextQueue = [...failed, ...untouched].slice(-OFFLINE_QUEUE_MAX_ITEMS);
  writeOfflineLeadQueue(nextQueue);

  return {
    attempted: retryNow.length,
    persisted,
    remaining: nextQueue.length,
    errors,
  };
}

export async function captureCommercialLead(input: CommercialLeadInput): Promise<CommercialLeadResult> {
  const email = input.email.trim().toLowerCase();
  const sourceVersions = getReportSourceSnapshot();
  const now = new Date().toISOString();
  const consentText =
    input.consentText?.trim() ||
    'I agree to be contacted about this AI automation risk report and related pilot opportunities.';
  const consentToContact = input.consentToContact === true;
  let artifactId: string | undefined;
  let artifactError: string | undefined;

  if (input.reportHtml) {
    try {
      const artifact = await createCommercialReportArtifact({
        artifactType: 'html-report',
        title: input.occupationTitle
          ? `${input.occupationTitle} ${input.reportType || 'occupation-risk'} report`
          : `${input.reportType || 'commercial'} report`,
        reportHtml: input.reportHtml,
        buyerSegment: input.buyerSegment || 'unknown',
        reportType: input.reportType || 'occupation-risk',
        occupationSlug: input.occupationSlug,
        occupationTitle: input.occupationTitle,
        occupationCode: typeof input.metadata?.soc_code === 'string' ? input.metadata.soc_code : undefined,
        sourceVersions,
        metadata: {
          ...input.metadata,
          source: input.source,
          captured_at: now,
        },
      });
      artifactId = artifact.id;
    } catch (error: unknown) {
      artifactError = getErrorMessage(error);
      console.warn('Commercial report artifact creation failed:', artifactError);
    }
  }

  const payload: CommercialLeadPayload = {
    email,
    source: input.source,
    buyer_segment: input.buyerSegment || 'unknown',
    report_type: input.reportType || 'occupation-risk',
    report_artifact_id: artifactId || null,
    occupation_slug: input.occupationSlug || null,
    occupation_title: input.occupationTitle || null,
    risk_score: typeof input.riskScore === 'number' ? input.riskScore : null,
    report_html: input.reportHtml || null,
    consent_to_contact: consentToContact,
    consent_text: consentToContact ? consentText : null,
    metadata: {
      ...input.metadata,
      utm: getUtmParams(),
      source_versions: sourceVersions,
      report_artifact_id: artifactId || null,
      artifact_error: artifactError || null,
      consent_to_contact: consentToContact,
      consent_text: consentToContact ? consentText : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      captured_at: now,
    },
  };

  try {
    const lead = await persistCommercialLeadPayload(payload);
    if (getQueuedCommercialLeadCount() > 0) {
      void flushQueuedCommercialLeads(5).catch((flushError) => {
        console.warn('Queued commercial lead retry failed:', flushError);
      });
    }

    return {
      persisted: true,
      offlineQueued: false,
      artifactPersisted: !!artifactId,
      artifactId,
      leadId: lead?.id,
      artifactError,
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.warn('Commercial lead capture fell back to offline queue:', message);
    try {
      queueOfflineLead(payload, message);
    } catch (queueError) {
      console.warn('Unable to queue commercial lead offline:', queueError);
    }

    return {
      persisted: false,
      offlineQueued: true,
      artifactPersisted: !!artifactId,
      artifactId,
      error: message,
      artifactError,
    };
  }
}
