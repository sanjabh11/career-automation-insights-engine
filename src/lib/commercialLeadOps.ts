import { supabase } from "@/integrations/supabase/client";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "archived"] as const;
export const OUTREACH_STAGES = [
  "not_started",
  "research_ready",
  "first_touch_sent",
  "follow_up_scheduled",
  "pilot_qualified",
  "paid_converted",
  "nurture_paused",
] as const;
export const OUTREACH_CHANNELS = ["linkedin", "email", "warm_intro", "webinar", "phone", "other"] as const;
export const OUTREACH_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export const OUTREACH_REPLY_SENTIMENTS = ["none", "positive", "neutral", "objection", "not_interested"] as const;
export const OUTREACH_OBJECTION_CATEGORIES = [
  "none",
  "pricing",
  "timing",
  "trust",
  "data_privacy",
  "integration",
  "not_priority",
  "other",
] as const;
export const OUTREACH_CAMPAIGN_VARIANTS = ["evidence_first", "workflow_first"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type OutreachStage = (typeof OUTREACH_STAGES)[number];
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];
export type OutreachPriority = (typeof OUTREACH_PRIORITIES)[number];
export type OutreachReplySentiment = (typeof OUTREACH_REPLY_SENTIMENTS)[number];
export type OutreachObjectionCategory = (typeof OUTREACH_OBJECTION_CATEGORIES)[number];
export type OutreachCampaignVariant = (typeof OUTREACH_CAMPAIGN_VARIANTS)[number];

export const OUTREACH_STAGE_LABELS: Record<OutreachStage, string> = {
  not_started: "Not started",
  research_ready: "Research ready",
  first_touch_sent: "First touch sent",
  follow_up_scheduled: "Follow-up scheduled",
  pilot_qualified: "Pilot qualified",
  paid_converted: "Paid converted",
  nurture_paused: "Nurture paused",
};

export const OUTREACH_CHANNEL_LABELS: Record<OutreachChannel, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  warm_intro: "Warm intro",
  webinar: "Webinar",
  phone: "Phone",
  other: "Other",
};

export const OUTREACH_PRIORITY_LABELS: Record<OutreachPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const OUTREACH_REPLY_SENTIMENT_LABELS: Record<OutreachReplySentiment, string> = {
  none: "No reply yet",
  positive: "Positive",
  neutral: "Neutral",
  objection: "Objection",
  not_interested: "Not interested",
};

export const OUTREACH_OBJECTION_CATEGORY_LABELS: Record<OutreachObjectionCategory, string> = {
  none: "No objection logged",
  pricing: "Pricing",
  timing: "Timing",
  trust: "Trust / evidence",
  data_privacy: "Data privacy",
  integration: "Integration",
  not_priority: "Not a priority",
  other: "Other",
};

export const OUTREACH_CAMPAIGN_VARIANT_LABELS: Record<OutreachCampaignVariant, string> = {
  evidence_first: "A: Evidence-first",
  workflow_first: "B: Workflow-first",
};

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

export interface CommercialLeadOutreachPlan {
  stage: OutreachStage;
  channel: OutreachChannel;
  priority: OutreachPriority;
  nextFollowUpAt: string | null;
  sequenceStep: number;
  nextAction: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface CommercialLeadResponseMetrics {
  repliedAt: string | null;
  replySentiment: OutreachReplySentiment;
  meetingBookedAt: string | null;
  sampleReportSentAt: string | null;
  usefulnessScore: number | null;
  objectionCategory: OutreachObjectionCategory;
  caseStudyPermission: boolean;
  paidPilotSignal: boolean;
  unsubscribeRequested: boolean;
  responseNotes: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface LeadOpsSummary {
  total: number;
  newLeads: number;
  coachLeads: number;
  workforceLeads: number;
  qualifiedOrConverted: number;
  followUpsDue: number;
  pilotReady: number;
  responsesLogged: number;
  meetingsBooked: number;
  paidPilotSignals: number;
  unsubscribeRequests: number;
  averageUsefulnessScore: number | null;
  averageRiskScore: number | null;
}

export interface CommercialOutreachCampaignSummary {
  total: number;
  sendAllowed: number;
  suppressed: number;
  missingConsent: number;
  unsubscribed: number;
  archivedOrConverted: number;
  pausedOrConverted: number;
  notInterested: number;
}

export interface CommercialOutreachExperimentVariantSummary {
  variant: OutreachCampaignVariant;
  variantLabel: string;
  hypothesis: string;
  total: number;
  sendAllowed: number;
  responsesLogged: number;
  positiveReplies: number;
  meetingsBooked: number;
  paidPilotSignals: number;
  averageUsefulnessScore: number | null;
  caveat: string;
  doesNotProve: string;
}

export interface CommercialOutreachCampaignRow {
  email: string;
  buyerSegment: string;
  sequenceName: string;
  sequenceStep: number;
  campaignVariant: OutreachCampaignVariant;
  variantLabel: string;
  variantHypothesis: string;
  channel: OutreachChannel;
  priority: OutreachPriority;
  sendAllowed: boolean;
  suppressionReason: string;
  trackedLink: string;
  analyticsEventName: string;
  conversionGoal: string;
  subject: string;
  firstTouch: string;
  followUp: string;
  proofArtifact: string;
  nextAction: string;
  nextFollowUpAt: string | null;
  sourceIds: string[];
  caveat: string;
  doesNotProve: string;
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
  rpc(
    functionName: "update_commercial_lead_outreach_plan",
    args: {
      p_lead_id: string;
      p_outreach_stage: OutreachStage;
      p_outreach_channel: OutreachChannel;
      p_priority: OutreachPriority;
      p_next_follow_up_at: string | null;
      p_sequence_step: number;
      p_next_action: string | null;
      p_staff_notes: string | null;
    }
  ): RpcResult<CommercialLeadRow[]>;
  rpc(
    functionName: "update_commercial_lead_response_metrics",
    args: {
      p_lead_id: string;
      p_replied_at: string | null;
      p_reply_sentiment: OutreachReplySentiment;
      p_meeting_booked_at: string | null;
      p_sample_report_sent_at: string | null;
      p_usefulness_score: number | null;
      p_objection_category: OutreachObjectionCategory;
      p_case_study_permission: boolean;
      p_paid_pilot_signal: boolean;
      p_unsubscribe_requested: boolean;
      p_response_notes: string | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isOutreachStage(value: unknown): value is OutreachStage {
  return OUTREACH_STAGES.some((stage) => stage === value);
}

function isOutreachChannel(value: unknown): value is OutreachChannel {
  return OUTREACH_CHANNELS.some((channel) => channel === value);
}

function isOutreachPriority(value: unknown): value is OutreachPriority {
  return OUTREACH_PRIORITIES.some((priority) => priority === value);
}

function isOutreachReplySentiment(value: unknown): value is OutreachReplySentiment {
  return OUTREACH_REPLY_SENTIMENTS.some((sentiment) => sentiment === value);
}

function isOutreachObjectionCategory(value: unknown): value is OutreachObjectionCategory {
  return OUTREACH_OBJECTION_CATEGORIES.some((category) => category === value);
}

function readBoundedScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const score = Math.trunc(value);
  return score >= 1 && score <= 5 ? score : null;
}

export function readCommercialLeadOutreachPlan(row: CommercialLeadRow): CommercialLeadOutreachPlan {
  const rawPlan = row.metadata?.outreach_pipeline;
  const plan = isRecord(rawPlan) ? rawPlan : {};
  return {
    stage: isOutreachStage(plan.stage) ? plan.stage : "not_started",
    channel: isOutreachChannel(plan.channel) ? plan.channel : "email",
    priority: isOutreachPriority(plan.priority) ? plan.priority : "medium",
    nextFollowUpAt: typeof plan.next_follow_up_at === "string" ? plan.next_follow_up_at : null,
    sequenceStep: typeof plan.sequence_step === "number" && Number.isFinite(plan.sequence_step)
      ? Math.max(0, Math.trunc(plan.sequence_step))
      : 0,
    nextAction: typeof plan.next_action === "string" ? plan.next_action : null,
    updatedAt: typeof plan.updated_at === "string" ? plan.updated_at : null,
    updatedByUserId: typeof plan.updated_by_user_id === "string" ? plan.updated_by_user_id : null,
  };
}

export function readCommercialLeadResponseMetrics(row: CommercialLeadRow): CommercialLeadResponseMetrics {
  const rawMetrics = row.metadata?.outreach_response_metrics;
  const metrics = isRecord(rawMetrics) ? rawMetrics : {};
  return {
    repliedAt: typeof metrics.replied_at === "string" ? metrics.replied_at : null,
    replySentiment: isOutreachReplySentiment(metrics.reply_sentiment) ? metrics.reply_sentiment : "none",
    meetingBookedAt: typeof metrics.meeting_booked_at === "string" ? metrics.meeting_booked_at : null,
    sampleReportSentAt: typeof metrics.sample_report_sent_at === "string" ? metrics.sample_report_sent_at : null,
    usefulnessScore: readBoundedScore(metrics.usefulness_score),
    objectionCategory: isOutreachObjectionCategory(metrics.objection_category) ? metrics.objection_category : "none",
    caseStudyPermission: metrics.case_study_permission === true,
    paidPilotSignal: metrics.paid_pilot_signal === true,
    unsubscribeRequested: metrics.unsubscribe_requested === true,
    responseNotes: typeof metrics.response_notes === "string" ? metrics.response_notes : null,
    updatedAt: typeof metrics.updated_at === "string" ? metrics.updated_at : null,
    updatedByUserId: typeof metrics.updated_by_user_id === "string" ? metrics.updated_by_user_id : null,
  };
}

export function isCommercialLeadFollowUpDue(row: CommercialLeadRow, now = new Date()): boolean {
  const plan = readCommercialLeadOutreachPlan(row);
  if (!plan.nextFollowUpAt || plan.stage === "paid_converted" || plan.stage === "nurture_paused") return false;
  const followUpDate = new Date(plan.nextFollowUpAt);
  return Number.isFinite(followUpDate.getTime()) && followUpDate.getTime() <= now.getTime();
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

export async function updateCommercialLeadOutreachPlan(input: {
  leadId: string;
  stage: OutreachStage;
  channel: OutreachChannel;
  priority: OutreachPriority;
  nextFollowUpAt?: string | null;
  sequenceStep?: number;
  nextAction?: string;
  staffNotes?: string;
}): Promise<CommercialLeadRow> {
  const { data, error } = await commercialLeadOpsClient.rpc("update_commercial_lead_outreach_plan", {
    p_lead_id: input.leadId,
    p_outreach_stage: input.stage,
    p_outreach_channel: input.channel,
    p_priority: input.priority,
    p_next_follow_up_at: input.nextFollowUpAt || null,
    p_sequence_step: Math.max(0, Math.trunc(input.sequenceStep ?? 0)),
    p_next_action: input.nextAction?.trim() || null,
    p_staff_notes: input.staffNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Unable to update commercial outreach plan.");
  }

  const updatedLead = data?.[0];
  if (!updatedLead) {
    throw new Error("Commercial outreach update returned no row.");
  }

  return updatedLead;
}

export async function updateCommercialLeadResponseMetrics(input: {
  leadId: string;
  repliedAt?: string | null;
  replySentiment?: OutreachReplySentiment;
  meetingBookedAt?: string | null;
  sampleReportSentAt?: string | null;
  usefulnessScore?: number | null;
  objectionCategory?: OutreachObjectionCategory;
  caseStudyPermission?: boolean;
  paidPilotSignal?: boolean;
  unsubscribeRequested?: boolean;
  responseNotes?: string;
}): Promise<CommercialLeadRow> {
  const { data, error } = await commercialLeadOpsClient.rpc("update_commercial_lead_response_metrics", {
    p_lead_id: input.leadId,
    p_replied_at: input.repliedAt || null,
    p_reply_sentiment: input.replySentiment || "none",
    p_meeting_booked_at: input.meetingBookedAt || null,
    p_sample_report_sent_at: input.sampleReportSentAt || null,
    p_usefulness_score: input.usefulnessScore ?? null,
    p_objection_category: input.objectionCategory || "none",
    p_case_study_permission: input.caseStudyPermission === true,
    p_paid_pilot_signal: input.paidPilotSignal === true,
    p_unsubscribe_requested: input.unsubscribeRequested === true,
    p_response_notes: input.responseNotes?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Unable to update commercial outreach response metrics.");
  }

  const updatedLead = data?.[0];
  if (!updatedLead) {
    throw new Error("Commercial outreach response update returned no row.");
  }

  return updatedLead;
}

export function summarizeCommercialLeads(rows: CommercialLeadRow[]): LeadOpsSummary {
  const scoredRows = rows.filter((row) => typeof row.risk_score === "number");
  const riskTotal = scoredRows.reduce((sum, row) => sum + (row.risk_score ?? 0), 0);
  const responseMetrics = rows.map(readCommercialLeadResponseMetrics);
  const scoredUsefulness = responseMetrics.filter((metrics) => typeof metrics.usefulnessScore === "number");
  const usefulnessTotal = scoredUsefulness.reduce((sum, metrics) => sum + (metrics.usefulnessScore ?? 0), 0);

  return {
    total: rows.length,
    newLeads: rows.filter((row) => row.status === "new").length,
    coachLeads: rows.filter((row) => isCoachSegment(row.buyer_segment)).length,
    workforceLeads: rows.filter((row) => isWorkforceSegment(row.buyer_segment)).length,
    qualifiedOrConverted: rows.filter((row) => row.status === "qualified" || row.status === "converted").length,
    followUpsDue: rows.filter((row) => isCommercialLeadFollowUpDue(row)).length,
    pilotReady: rows.filter((row) => readCommercialLeadOutreachPlan(row).stage === "pilot_qualified").length,
    responsesLogged: responseMetrics.filter((metrics) => metrics.replySentiment !== "none" || Boolean(metrics.repliedAt)).length,
    meetingsBooked: responseMetrics.filter((metrics) => Boolean(metrics.meetingBookedAt)).length,
    paidPilotSignals: responseMetrics.filter((metrics) => metrics.paidPilotSignal).length,
    unsubscribeRequests: responseMetrics.filter((metrics) => metrics.unsubscribeRequested).length,
    averageUsefulnessScore: scoredUsefulness.length ? Math.round((usefulnessTotal / scoredUsefulness.length) * 10) / 10 : null,
    averageRiskScore: scoredRows.length ? Math.round((riskTotal / scoredRows.length) * 10) / 10 : null,
  };
}

function normalizeSegment(segment: string): string {
  return segment.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function deterministicVariantSeed(value: string): number {
  return value.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function assignCampaignVariant(row: CommercialLeadRow): OutreachCampaignVariant {
  const seed = deterministicVariantSeed(row.id || row.email || row.created_at);
  return seed % 2 === 0 ? "evidence_first" : "workflow_first";
}

function getCampaignVariantProfile(variant: OutreachCampaignVariant): {
  hypothesis: string;
  subjectPrefix: string;
  firstTouchFrame: string;
  followUpFrame: string;
  conversionGoal: string;
  caveat: string;
  doesNotProve: string;
} {
  if (variant === "workflow_first") {
    return {
      hypothesis: "Workflow-first copy should perform better when the buyer already feels AI pressure and needs a practical pilot path.",
      subjectPrefix: "Pilot workflow review:",
      firstTouchFrame: "Lead with the bounded pilot workflow, expected review owner, and next action before sharing the proof artifact.",
      followUpFrame: "Ask whether the proposed pilot workflow fits their decision cycle and what governance blocker would stop a review.",
      conversionGoal: "meeting_booked_or_review_owner_named",
      caveat: "Variant assignment supports founder-led learning only; it is not statistically powered without sufficient real responses.",
      doesNotProve: "Does not prove channel fit, market demand, deliverability, or message superiority.",
    };
  }

  return {
    hypothesis: "Evidence-first copy should perform better when trust, source provenance, and compliance boundaries are the main objection.",
    subjectPrefix: "Evidence review:",
    firstTouchFrame: "Lead with evidence cards, source caveats, and does-not-prove boundaries before asking for a pilot review.",
    followUpFrame: "Ask whether the evidence and caveat language improves trust enough to schedule a review.",
    conversionGoal: "reply_or_feedback_call",
    caveat: "Variant assignment supports founder-led learning only; it is not statistically powered without sufficient real responses.",
    doesNotProve: "Does not prove channel fit, market demand, deliverability, or message superiority.",
  };
}

function getCampaignProfile(row: CommercialLeadRow): Pick<
  CommercialOutreachCampaignRow,
  "sequenceName" | "subject" | "firstTouch" | "followUp" | "proofArtifact" | "sourceIds" | "caveat" | "doesNotProve"
> {
  const segment = normalizeSegment(row.buyer_segment || "");
  if (isWorkforceSegment(segment)) {
    return {
      sequenceName: "workforce_csv_audit_pilot",
      subject: "Role-level AI transition audit for your workforce planning review",
      firstTouch:
        "Offer a 10-25 role CSV audit with no employee names, source-labeled caveats, and no employment-decision use.",
      followUp:
        "Share the executive report skeleton and ask who should own SOC review, local-market validation, and governance sign-off.",
      proofArtifact: "/enterprise-dashboard",
      sourceIds: ["dol-ai-literacy-framework", "bls-emp", "ada-ai-hiring-guidance"],
      caveat: "Use only for role-level planning until buyer governance, local data validation, and human review are signed off.",
      doesNotProve: "Does not predict layoffs, rank employees, or support hiring, firing, pay, promotion, or discipline decisions.",
    };
  }

  if (segment.includes("career_center") || segment.includes("counselor") || segment.includes("student")) {
    return {
      sequenceName: "career_center_cohort_review",
      subject: "Aggregate-only AI work transition proof pack for counselor review",
      firstTouch:
        "Send an aggregate cohort proof-pack sample and ask which privacy, cohort, or skill-ledger fields would help a workshop.",
      followUp:
        "Ask whether small-cell suppression, NACE outcome separation, and advisor review notes meet the institution's review needs.",
      proofArtifact: "/tools/counselor-reports",
      sourceIds: ["ferpa-student-privacy", "nace-first-destination", "nace-career-readiness"],
      caveat: "Student or alumni data must stay aggregate-only unless consent, retention, and institutional review are approved.",
      doesNotProve: "Does not certify student outcomes, placement rates, or institutional compliance.",
    };
  }

  return {
    sequenceName: "coach_sample_report_review",
    subject: "Source-labeled AI career transition sample report for your coaching review",
    firstTouch:
      "Send a coach-branded sample report and ask for role-specific feedback on evidence cards, caveats, and client usefulness.",
    followUp:
      "Share one source/caveat section and ask whether it would improve client trust before a paid pilot.",
    proofArtifact: "/sample-report",
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
    caveat: "Coach outreach must stay framed as human-reviewed planning guidance, not validated career assessment.",
    doesNotProve: "Does not guarantee career outcomes, job placement, wage gains, or automation timing.",
  };
}

function buildTrackedCampaignLink(
  row: CommercialLeadRow,
  proofArtifact: string,
  baseUrl: string,
  variant: OutreachCampaignVariant
): string {
  const root = baseUrl.replace(/\/+$/, "") || "https://automationinsights.app";
  const url = new URL(proofArtifact, `${root}/`);
  const plan = readCommercialLeadOutreachPlan(row);
  url.searchParams.set("utm_source", "commercial_lead_ops");
  url.searchParams.set("utm_medium", plan.channel || "email");
  url.searchParams.set("utm_campaign", "founder_led_pilot");
  url.searchParams.set(
    "utm_content",
    `${normalizeSegment(row.buyer_segment || "unknown") || "unknown"}_${variant}_step_${Math.max(1, plan.sequenceStep || 1)}`
  );
  url.searchParams.set("utm_term", variant);
  url.searchParams.set("lead_id", row.id);
  return url.toString();
}

function readSuppressionReason(row: CommercialLeadRow): string {
  const plan = readCommercialLeadOutreachPlan(row);
  const metrics = readCommercialLeadResponseMetrics(row);
  if (metrics.unsubscribeRequested) return "unsubscribe_requested";
  if (!row.consent_to_contact) return "missing_contact_consent";
  if (row.status === "archived" || row.status === "converted") return `lead_status_${row.status}`;
  if (plan.stage === "nurture_paused" || plan.stage === "paid_converted") return `outreach_stage_${plan.stage}`;
  if (metrics.replySentiment === "not_interested") return "reply_not_interested";
  return "";
}

export function buildCommercialOutreachCampaignRows(
  rows: CommercialLeadRow[],
  options: { baseUrl?: string } = {}
): CommercialOutreachCampaignRow[] {
  const baseUrl = options.baseUrl || "https://automationinsights.app";
  return rows.map((row) => {
    const plan = readCommercialLeadOutreachPlan(row);
    const profile = getCampaignProfile(row);
    const campaignVariant = assignCampaignVariant(row);
    const variantProfile = getCampaignVariantProfile(campaignVariant);
    const suppressionReason = readSuppressionReason(row);
    const sendAllowed = suppressionReason === "";
    const sequenceStep = Math.max(1, plan.sequenceStep || 1);
    const firstTouch = `${variantProfile.firstTouchFrame} ${profile.firstTouch}`;
    const followUp = `${variantProfile.followUpFrame} ${profile.followUp}`;
    return {
      email: row.email,
      buyerSegment: row.buyer_segment,
      sequenceName: profile.sequenceName,
      sequenceStep,
      campaignVariant,
      variantLabel: OUTREACH_CAMPAIGN_VARIANT_LABELS[campaignVariant],
      variantHypothesis: variantProfile.hypothesis,
      channel: plan.channel,
      priority: plan.priority,
      sendAllowed,
      suppressionReason,
      trackedLink: buildTrackedCampaignLink(row, profile.proofArtifact, baseUrl, campaignVariant),
      analyticsEventName: "founder_led_pilot_outreach_click",
      conversionGoal: variantProfile.conversionGoal,
      subject: `${variantProfile.subjectPrefix} ${profile.subject}`,
      firstTouch,
      followUp,
      proofArtifact: profile.proofArtifact,
      nextAction: plan.nextAction || (sequenceStep <= 1 ? firstTouch : followUp),
      nextFollowUpAt: plan.nextFollowUpAt,
      sourceIds: profile.sourceIds,
      caveat: `${profile.caveat} ${variantProfile.caveat}`,
      doesNotProve: `${profile.doesNotProve} ${variantProfile.doesNotProve}`,
    };
  });
}

export function summarizeCommercialOutreachCampaign(rows: CommercialLeadRow[]): CommercialOutreachCampaignSummary {
  const campaignRows = buildCommercialOutreachCampaignRows(rows);
  return {
    total: campaignRows.length,
    sendAllowed: campaignRows.filter((row) => row.sendAllowed).length,
    suppressed: campaignRows.filter((row) => !row.sendAllowed).length,
    missingConsent: campaignRows.filter((row) => row.suppressionReason === "missing_contact_consent").length,
    unsubscribed: campaignRows.filter((row) => row.suppressionReason === "unsubscribe_requested").length,
    archivedOrConverted: campaignRows.filter((row) => row.suppressionReason === "lead_status_archived" || row.suppressionReason === "lead_status_converted").length,
    pausedOrConverted: campaignRows.filter((row) => row.suppressionReason === "outreach_stage_nurture_paused" || row.suppressionReason === "outreach_stage_paid_converted").length,
    notInterested: campaignRows.filter((row) => row.suppressionReason === "reply_not_interested").length,
  };
}

export function summarizeCommercialOutreachExperiment(
  rows: CommercialLeadRow[]
): CommercialOutreachExperimentVariantSummary[] {
  return OUTREACH_CAMPAIGN_VARIANTS.map((variant) => {
    const variantRows = rows.filter((row) => assignCampaignVariant(row) === variant);
    const campaignRows = buildCommercialOutreachCampaignRows(variantRows);
    const responseMetrics = variantRows.map(readCommercialLeadResponseMetrics);
    const scoredUsefulness = responseMetrics.filter((metrics) => typeof metrics.usefulnessScore === "number");
    const usefulnessTotal = scoredUsefulness.reduce((sum, metrics) => sum + (metrics.usefulnessScore ?? 0), 0);
    const profile = getCampaignVariantProfile(variant);

    return {
      variant,
      variantLabel: OUTREACH_CAMPAIGN_VARIANT_LABELS[variant],
      hypothesis: profile.hypothesis,
      total: variantRows.length,
      sendAllowed: campaignRows.filter((row) => row.sendAllowed).length,
      responsesLogged: responseMetrics.filter((metrics) => metrics.replySentiment !== "none" || Boolean(metrics.repliedAt)).length,
      positiveReplies: responseMetrics.filter((metrics) => metrics.replySentiment === "positive").length,
      meetingsBooked: responseMetrics.filter((metrics) => Boolean(metrics.meetingBookedAt)).length,
      paidPilotSignals: responseMetrics.filter((metrics) => metrics.paidPilotSignal).length,
      averageUsefulnessScore: scoredUsefulness.length ? Math.round((usefulnessTotal / scoredUsefulness.length) * 10) / 10 : null,
      caveat: profile.caveat,
      doesNotProve: profile.doesNotProve,
    };
  });
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
  "outreach_stage",
  "outreach_channel",
  "outreach_priority",
  "outreach_sequence_step",
  "outreach_next_follow_up_at",
  "outreach_next_action",
  "response_replied_at",
  "response_sentiment",
  "response_meeting_booked_at",
  "response_sample_report_sent_at",
  "response_usefulness_score",
  "response_objection_category",
  "response_paid_pilot_signal",
  "response_case_study_permission",
  "response_unsubscribe_requested",
  "response_notes",
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
  const body = rows.map((row) => {
    const outreachPlan = readCommercialLeadOutreachPlan(row);
    const responseMetrics = readCommercialLeadResponseMetrics(row);
    return [
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
      outreachPlan.stage,
      outreachPlan.channel,
      outreachPlan.priority,
      outreachPlan.sequenceStep,
      outreachPlan.nextFollowUpAt,
      outreachPlan.nextAction,
      responseMetrics.repliedAt,
      responseMetrics.replySentiment,
      responseMetrics.meetingBookedAt,
      responseMetrics.sampleReportSentAt,
      responseMetrics.usefulnessScore,
      responseMetrics.objectionCategory,
      responseMetrics.paidPilotSignal ? "yes" : "no",
      responseMetrics.caseStudyPermission ? "yes" : "no",
      responseMetrics.unsubscribeRequested ? "yes" : "no",
      responseMetrics.responseNotes,
      row.consent_to_contact ? "yes" : "no",
      row.consent_captured_at,
      row.last_contacted_at,
      row.staff_notes,
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [csvHeaders.join(","), ...body].join("\n");
}

const campaignCsvHeaders = [
  "send_allowed",
  "suppression_reason",
  "email",
  "buyer_segment",
  "sequence_name",
  "sequence_step",
  "campaign_variant",
  "campaign_variant_label",
  "variant_hypothesis",
  "channel",
  "priority",
  "subject",
  "first_touch",
  "follow_up",
  "next_action",
  "next_follow_up_at",
  "tracked_link",
  "analytics_event_name",
  "conversion_goal",
  "proof_artifact",
  "source_ids",
  "caveat",
  "does_not_prove",
];

export function buildCommercialOutreachCampaignCsv(
  rows: CommercialLeadRow[],
  options: { baseUrl?: string } = {}
): string {
  const body = buildCommercialOutreachCampaignRows(rows, options).map((row) =>
    [
      row.sendAllowed ? "yes" : "no",
      row.suppressionReason,
      row.email,
      row.buyerSegment,
      row.sequenceName,
      row.sequenceStep,
      row.campaignVariant,
      row.variantLabel,
      row.variantHypothesis,
      row.channel,
      row.priority,
      row.subject,
      row.firstTouch,
      row.followUp,
      row.nextAction,
      row.nextFollowUpAt,
      row.trackedLink,
      row.analyticsEventName,
      row.conversionGoal,
      row.proofArtifact,
      row.sourceIds.join("|"),
      row.caveat,
      row.doesNotProve,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [campaignCsvHeaders.join(","), ...body].join("\n");
}
