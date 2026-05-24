import type { OccupationRiskData } from "@/data/occupationRiskData";
import {
  createEvidenceCard,
  getEvidenceCardCss,
  renderEvidenceCardsHtml,
  type EvidenceCard,
  type EvidenceConfidence,
  type ReportReviewStatus,
  REVIEW_STATUS_LABELS,
} from "@/lib/reportEvidenceCards";

export type TaskExposureBucket = "automatable" | "ai_assisted" | "human_led" | "emerging";
export type TaskWeightingMethod = "seed_score_proxy" | "onet_task_ratings_ready" | "workforce_headcount_weighted";
export type SkillChangeStatus = "growing" | "stable" | "declining" | "changing" | "unknown";
export type SkillAction = "protect" | "upgrade" | "replace" | "learn_next";
export type AiEraRoleTaxonomyStatus = "emerging-not-taxonomy-mapped" | "taxonomy-mapped";
export type AiEraRoleMarketValidationStatus = "needs-posting-validation" | "posting-validated" | "provider-validated";
export type ProofPackSectionId =
  | "decision_boundary"
  | "task_exposure_split"
  | "skill_change_ledger"
  | "ai_era_role_radar"
  | "evidence_cards"
  | "client_delivery";

export interface TaskWeightingMetadata {
  method: TaskWeightingMethod;
  priorityWeight: number;
  importanceProxy: number;
  frequencyProxy: "high" | "medium" | "low" | "unknown";
  evidenceBasis: string;
  caveat: string;
}

export interface OnetTaskRatingWeightInput {
  exposureScore: number;
  importance: number | null;
  frequencyCategory?: number | null;
  frequencyLabel?: string | null;
  frequencyPercent?: number | null;
  relevance?: number | null;
  recommendSuppress?: boolean | null;
  releaseVersion?: string | null;
  evidenceBasis?: string;
}

export interface TaskExposureItem {
  task: string;
  bucket: TaskExposureBucket;
  exposureScore: number;
  weighting: TaskWeightingMetadata;
  rationale: string;
  sourceIds: string[];
}

export interface SkillChangeItem {
  skill: string;
  status: SkillChangeStatus;
  action: SkillAction;
  rationale: string;
  sourceIds: string[];
  confidence: EvidenceConfidence;
  reviewStatus: ReportReviewStatus;
  caveat: string;
}

export interface AiEraRole {
  title: string;
  status: "emerging-signal";
  adjacentRoleHint: string;
  skills: string[];
  whyItMatters: string;
  caveat: string;
  sourceIds: string[];
  confidence: EvidenceConfidence;
  reviewStatus: ReportReviewStatus;
  taxonomyStatus: AiEraRoleTaxonomyStatus;
  marketValidationStatus: AiEraRoleMarketValidationStatus;
  validationNote: string;
  searchTerms: string[];
}

export interface ProofPackSectionReview {
  sectionId: ProofPackSectionId;
  sectionTitle: string;
  reviewStatus: ReportReviewStatus;
  requiredForInstitutionalDelivery: boolean;
  reviewerRole: string;
  clientReady: boolean;
  blockingReason: string;
  caveat: string;
  sourceIds: string[];
  evidenceCardIds: string[];
  acceptanceCriteria: string[];
  allowedNextStatuses: ReportReviewStatus[];
}

export interface TransitionProofPack {
  generatedAt: string;
  reviewStatus: ReportReviewStatus;
  context: "individual" | "coach" | "workforce";
  title: string;
  summary: string;
  taskExposure: TaskExposureItem[];
  skillLedger: SkillChangeItem[];
  aiEraRoles: AiEraRole[];
  evidenceCards: EvidenceCard[];
  sectionReviews: ProofPackSectionReview[];
  nextActions: string[];
}

interface WorkforceProofPackRow {
  department: string;
  role: string;
  headcount: number;
  apoScore: number;
  socCode?: string;
}

type AiEraRoleSeed = Omit<
  AiEraRole,
  "reviewStatus" | "taxonomyStatus" | "marketValidationStatus" | "validationNote" | "searchTerms"
>;

const ROLE_RADAR_MARKET_SIGNAL_SOURCE_ID = "ai-workforce-consortium-2025";

function buildRoleSearchTerms(role: AiEraRoleSeed): string[] {
  return Array.from(new Set([
    role.title,
    ...role.adjacentRoleHint.split(",").map((item) => item.trim()).filter(Boolean),
    ...role.skills.slice(0, 2),
  ])).slice(0, 6);
}

const AI_ERA_ROLE_RADAR_SEEDS: AiEraRoleSeed[] = [
  {
    title: "AI Operations Analyst",
    status: "emerging-signal",
    adjacentRoleHint: "business analyst, operations analyst, customer operations lead",
    skills: ["workflow mapping", "AI tool evaluation", "exception handling", "operational metrics"],
    whyItMatters: "Organizations need operators who can convert AI capability into governed process improvements.",
    caveat: "Emerging role label, not an official SOC/O*NET occupation.",
    sourceIds: ["wef-foj-2025", "anthropic-observed-exposure", "lightcast"],
    confidence: "medium",
  },
  {
    title: "Human-in-the-Loop Review Lead",
    status: "emerging-signal",
    adjacentRoleHint: "quality analyst, compliance specialist, operations supervisor",
    skills: ["review rubric design", "quality assurance", "bias escalation", "audit trails"],
    whyItMatters: "AI-assisted work still needs accountable human review before high-impact use.",
    caveat: "Use as a transition theme until employer-specific role design is validated.",
    sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Compliance Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "compliance officer, HR specialist, legal operations analyst",
    skills: ["policy tracking", "vendor review", "documentation", "employment-use boundaries"],
    whyItMatters: "Workforce AI creates documentation and review obligations across HR, legal, and operations.",
    caveat: "Not legal advice and not a substitute for counsel-led AI governance.",
    sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "bls-ai-mlr-2025"],
    confidence: "medium",
  },
  {
    title: "AI Workflow Designer",
    status: "emerging-signal",
    adjacentRoleHint: "project manager, process analyst, product operations specialist",
    skills: ["process redesign", "prompt patterns", "acceptance criteria", "change management"],
    whyItMatters: "Teams need people who can redesign work around AI while preserving accountability.",
    caveat: "Emerging title varies widely by employer and industry.",
    sourceIds: ["wef-foj-2025", "anthropic-economic-index", "llm-output"],
    confidence: "medium",
  },
  {
    title: "Prompt Workflow Specialist",
    status: "emerging-signal",
    adjacentRoleHint: "content strategist, support operations analyst, enablement specialist",
    skills: ["prompt library design", "output evaluation", "knowledge-base maintenance", "user enablement"],
    whyItMatters: "Repeatable prompt and evaluation workflows turn ad hoc AI use into managed capability.",
    caveat: "Prompting alone is not durable; pair it with domain expertise and evaluation skill.",
    sourceIds: ["anthropic-economic-index", "openai-gdpval", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Enablement Trainer",
    status: "emerging-signal",
    adjacentRoleHint: "training specialist, instructional designer, L&D partner",
    skills: ["adult learning", "AI fluency", "scenario design", "learning measurement"],
    whyItMatters: "Broad AI adoption requires role-specific training rather than generic tool demos.",
    caveat: "Training impact must be measured with learner outcomes, not attendance alone.",
    sourceIds: ["wef-foj-2025", "wcag-22", "llm-output"],
    confidence: "medium",
  },
  {
    title: "Model Risk Analyst",
    status: "emerging-signal",
    adjacentRoleHint: "risk analyst, credit analyst, compliance analyst",
    skills: ["model controls", "validation evidence", "risk documentation", "stakeholder review"],
    whyItMatters: "More AI-assisted decisions create demand for model controls and auditability.",
    caveat: "Regulated uses require formal validation beyond this product's planning output.",
    sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "bls-ai-mlr-2025"],
    confidence: "medium",
  },
  {
    title: "AI Customer Operations Lead",
    status: "emerging-signal",
    adjacentRoleHint: "customer service supervisor, customer success manager, support operations lead",
    skills: ["conversation analytics", "escalation design", "service QA", "customer empathy"],
    whyItMatters: "Customer operations are rapidly augmented by AI but still need escalation, quality, and trust ownership.",
    caveat: "Automation value depends on channel, product complexity, and customer expectations.",
    sourceIds: ["anthropic-observed-exposure", "bls-ai-mlr-2025", "wef-foj-2025"],
    confidence: "medium",
  },
  {
    title: "Agentic Process Designer",
    status: "emerging-signal",
    adjacentRoleHint: "business process manager, systems analyst, operations research analyst",
    skills: ["agent workflow constraints", "handoff design", "monitoring", "failure-mode analysis"],
    whyItMatters: "Agentic tools need structured work boundaries, monitoring, and fallback paths.",
    caveat: "Treat as future-facing until approved AI agents are deployed in the target organization.",
    sourceIds: ["openai-gdpval", "nist-ai-rmf", "llm-output"],
    confidence: "low",
  },
  {
    title: "AI Data Quality Steward",
    status: "emerging-signal",
    adjacentRoleHint: "data analyst, database administrator, records manager",
    skills: ["data quality rules", "metadata", "privacy controls", "source lineage"],
    whyItMatters: "AI usefulness depends on clean, governed, and traceable data inputs.",
    caveat: "Employer data architecture determines the actual job design.",
    sourceIds: ["bls-ai-mlr-2025", "nist-ai-rmf", "lightcast"],
    confidence: "medium",
  },
  {
    title: "AI Knowledge Base Manager",
    status: "emerging-signal",
    adjacentRoleHint: "technical writer, customer support lead, documentation manager",
    skills: ["knowledge curation", "retrieval testing", "content governance", "answer evaluation"],
    whyItMatters: "AI assistants need reliable knowledge sources and update workflows.",
    caveat: "This is a role pattern; titles vary across support, product, and IT teams.",
    sourceIds: ["anthropic-economic-index", "openai-gdpval", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI-Assisted Legal Operations Specialist",
    status: "emerging-signal",
    adjacentRoleHint: "paralegal, legal operations analyst, contract manager",
    skills: ["contract review QA", "matter operations", "legal tech", "risk escalation"],
    whyItMatters: "Legal work is exposed to AI assistance but still requires accountable review.",
    caveat: "Does not authorize legal advice or unreviewed legal outputs.",
    sourceIds: ["bls-ai-mlr-2025", "nist-ai-rmf", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Finance Controls Analyst",
    status: "emerging-signal",
    adjacentRoleHint: "accountant, auditor, financial analyst",
    skills: ["control testing", "variance review", "automation QA", "financial interpretation"],
    whyItMatters: "Finance teams need people who can review AI-assisted analysis and preserve controls.",
    caveat: "Accounting standards and internal controls remain human-accountable.",
    sourceIds: ["bls-ai-mlr-2025", "wef-foj-2025", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Recruiting Operations Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "recruiter, HR coordinator, talent operations analyst",
    skills: ["candidate communication", "selection-tool documentation", "bias review", "workflow design"],
    whyItMatters: "Recruiting AI requires transparency, accommodation, and review boundaries.",
    caveat: "Must not be used for selection decisions without validation and legal review.",
    sourceIds: ["ada-ai-hiring-guidance", "nist-ai-rmf", "wcag-22"],
    confidence: "medium",
  },
  {
    title: "AI Learning Path Curator",
    status: "emerging-signal",
    adjacentRoleHint: "instructional designer, career counselor, L&D specialist",
    skills: ["skills taxonomy", "course curation", "learner advising", "outcome measurement"],
    whyItMatters: "Workers need targeted learning paths tied to changing work, not generic course catalogs.",
    caveat: "Course recommendations require provider, cost, and learner-context validation.",
    sourceIds: ["wef-foj-2025", "esco", "lightcast"],
    confidence: "medium",
  },
  {
    title: "AI Product Operations Specialist",
    status: "emerging-signal",
    adjacentRoleHint: "product manager, product analyst, customer success manager",
    skills: ["feedback triage", "AI feature rollout", "usage analysis", "risk escalation"],
    whyItMatters: "AI products need operational ownership for quality, adoption, and user trust.",
    caveat: "Emerging signal only; validate against real job postings before marketing as an occupation.",
    sourceIds: ["lightcast", "wef-foj-2025", "llm-output"],
    confidence: "low",
  },
  {
    title: "AI Safety Documentation Specialist",
    status: "emerging-signal",
    adjacentRoleHint: "technical writer, compliance analyst, policy analyst",
    skills: ["model documentation", "risk notes", "change logs", "user-facing caveats"],
    whyItMatters: "AI systems need understandable documentation for review, audit, and user trust.",
    caveat: "Safety documentation does not replace technical, legal, or independent audit.",
    sourceIds: ["nist-ai-rmf", "wcag-22", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Evaluation Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "QA analyst, data analyst, research assistant",
    skills: ["test cases", "rubric design", "output scoring", "regression tracking"],
    whyItMatters: "AI adoption creates ongoing demand for evaluation and quality evidence.",
    caveat: "Evaluation quality depends on domain-specific test design.",
    sourceIds: ["openai-gdpval", "anthropic-observed-exposure", "nist-ai-rmf"],
    confidence: "medium",
  },
  {
    title: "AI Change Management Partner",
    status: "emerging-signal",
    adjacentRoleHint: "HR business partner, project manager, training specialist",
    skills: ["stakeholder communication", "adoption planning", "job redesign", "feedback loops"],
    whyItMatters: "AI transformation succeeds or fails through work redesign and human adoption.",
    caveat: "Adoption plans must reflect local labor relations, accessibility, and policy constraints.",
    sourceIds: ["wef-foj-2025", "nist-ai-rmf", "ada-ai-hiring-guidance"],
    confidence: "medium",
  },
  {
    title: "AI Vendor Risk Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "procurement specialist, compliance analyst, IT manager",
    skills: ["vendor inventory", "contract review", "risk questionnaires", "accessibility review"],
    whyItMatters: "AI features are increasingly embedded in workplace vendors and need inventory controls.",
    caveat: "Requires organization-specific vendor and legal review.",
    sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "wcag-22"],
    confidence: "medium",
  },
  {
    title: "Automation Exception Manager",
    status: "emerging-signal",
    adjacentRoleHint: "operations supervisor, customer operations lead, claims examiner",
    skills: ["exception queues", "root-cause analysis", "customer recovery", "control monitoring"],
    whyItMatters: "As routine workflows automate, human value shifts toward exceptions and accountability.",
    caveat: "Task mix and automation maturity must be validated for each employer.",
    sourceIds: ["anthropic-observed-exposure", "bls-ai-mlr-2025", "wef-foj-2025"],
    confidence: "medium",
  },
  {
    title: "AI-Enabled Field Diagnostics Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "field technician, maintenance planner, operations dispatcher",
    skills: ["AI diagnostics", "safety review", "field coordination", "asset data"],
    whyItMatters: "Physical work is less directly automated by GenAI but increasingly augmented by diagnostics.",
    caveat: "Physical, safety-critical, and regulated work requires local validation.",
    sourceIds: ["bls-ai-mlr-2025", "wef-foj-2025", "llm-output"],
    confidence: "low",
  },
  {
    title: "AI Content QA Editor",
    status: "emerging-signal",
    adjacentRoleHint: "editor, marketing specialist, communications manager",
    skills: ["brand judgment", "fact checking", "AI output QA", "audience adaptation"],
    whyItMatters: "Generated content increases demand for review, trust, and audience-specific judgment.",
    caveat: "Content roles differ sharply by brand, domain, and liability context.",
    sourceIds: ["anthropic-economic-index", "openai-gdpval", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Service Recovery Specialist",
    status: "emerging-signal",
    adjacentRoleHint: "customer service representative, customer success manager, support lead",
    skills: ["complex escalation", "relationship repair", "policy judgment", "case documentation"],
    whyItMatters: "Automated support creates new need for humans who handle sensitive exceptions.",
    caveat: "Validate against customer expectations and regulated communication requirements.",
    sourceIds: ["anthropic-observed-exposure", "wef-foj-2025", "llm-output"],
    confidence: "medium",
  },
  {
    title: "AI Accessibility Review Coordinator",
    status: "emerging-signal",
    adjacentRoleHint: "UX researcher, QA analyst, compliance specialist",
    skills: ["accessibility testing", "assistive tech checks", "inclusive design", "issue triage"],
    whyItMatters: "Commercial AI workflows need accessibility checks before institutional rollout.",
    caveat: "Automated checks do not prove WCAG conformance.",
    sourceIds: ["wcag-22", "ada-ai-hiring-guidance", "nist-ai-rmf"],
    confidence: "medium",
  },
];

const AI_ERA_ROLE_RADAR: AiEraRole[] = AI_ERA_ROLE_RADAR_SEEDS.map((role) => ({
  ...role,
  sourceIds: Array.from(new Set([...role.sourceIds, ROLE_RADAR_MARKET_SIGNAL_SOURCE_ID])),
  reviewStatus: "staff_review_required",
  taxonomyStatus: "emerging-not-taxonomy-mapped",
  marketValidationStatus: "needs-posting-validation",
  validationNote: "Search-term signal only until validated against current postings and mapped to SOC/O*NET or ESCO.",
  searchTerms: buildRoleSearchTerms(role),
}));

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function stripScoreLabel(value: string): string {
  return value.replace(/\s*\([^)]*%[^)]*\)\s*/g, "").trim();
}

function parseTaskScore(value: string, fallback: number): number {
  const match = value.match(/(\d{1,3})\s*%/);
  if (!match) return fallback;
  return Math.max(0, Math.min(100, Number(match[1])));
}

function bucketForScore(score: number): TaskExposureBucket {
  if (score >= 80) return "automatable";
  if (score >= 50) return "ai_assisted";
  return "human_led";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function frequencyProxyForScore(score: number): TaskWeightingMetadata["frequencyProxy"] {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

function frequencyProxyForCategory(category?: number | null): TaskWeightingMetadata["frequencyProxy"] {
  if (!category) return "unknown";
  if (category >= 5) return "high";
  if (category >= 3) return "medium";
  return "low";
}

function frequencyWeightForCategory(category?: number | null): number {
  if (!category) return 0.35;
  return clamp(category / 7, 0.1, 1);
}

export function buildOnetTaskRatingWeighting(input: OnetTaskRatingWeightInput): TaskWeightingMetadata {
  const importance = clamp(input.importance ?? 3, 1, 5);
  const frequencyWeight = frequencyWeightForCategory(input.frequencyCategory);
  const exposureWeight = clamp(input.exposureScore / 100, 0.05, 1);
  const release = input.releaseVersion || "30.3";
  const frequencyPhrase = input.frequencyLabel
    ? `${input.frequencyLabel}${input.frequencyPercent !== null && input.frequencyPercent !== undefined ? ` (${roundToTwo(input.frequencyPercent)}%)` : ""}`
    : "frequency category unavailable";
  const relevancePhrase = input.relevance !== null && input.relevance !== undefined
    ? `, ${roundToTwo(input.relevance)} relevance`
    : "";
  const suppressPhrase = input.recommendSuppress
    ? " Low-precision O*NET ratings are flagged for review."
    : "";

  return {
    method: "onet_task_ratings_ready",
    priorityWeight: roundToTwo(clamp(exposureWeight * ((importance / 5) * 0.65 + frequencyWeight * 0.35), 0.05, 1)),
    importanceProxy: roundToTwo(importance),
    frequencyProxy: frequencyProxyForCategory(input.frequencyCategory),
    evidenceBasis: input.evidenceBasis || `O*NET ${release} Task Ratings: ${roundToTwo(importance)}/5 importance${relevancePhrase}; dominant frequency ${frequencyPhrase}.`,
    caveat: `O*NET Task Ratings are occupation-level survey summaries, not exact task-time allocation for a person or employer.${suppressPhrase}`,
  };
}

function buildSeedTaskWeighting(score: number, rank: number, evidenceBasis: string): TaskWeightingMetadata {
  const rankMultiplier = clamp(1 - rank * 0.05, 0.75, 1);
  return {
    method: "seed_score_proxy",
    priorityWeight: roundToTwo(clamp((score / 100) * rankMultiplier, 0.05, 1)),
    importanceProxy: roundToTwo(clamp(score / 20, 1, 5)),
    frequencyProxy: frequencyProxyForScore(score),
    evidenceBasis,
    caveat: "Proxy weight from current seed score; use checksum-verified O*NET Task Ratings before claiming task-time precision.",
  };
}

function buildWorkforceTaskWeighting(row: WorkforceProofPackRow, maxWeightedExposure: number): TaskWeightingMetadata {
  const weightedExposure = row.apoScore * Math.max(1, row.headcount);
  return {
    method: "workforce_headcount_weighted",
    priorityWeight: roundToTwo(clamp(weightedExposure / Math.max(1, maxWeightedExposure), 0.05, 1)),
    importanceProxy: roundToTwo(clamp(row.apoScore / 20, 1, 5)),
    frequencyProxy: "unknown",
    evidenceBasis: `${row.headcount} role(s) x ${Math.round(row.apoScore)} APO score from uploaded workforce CSV.`,
    caveat: "Headcount weighting is not task-time allocation; validate task mix and O*NET Task Ratings before executive planning.",
  };
}

function roleRelevanceScore(role: AiEraRole, data: OccupationRiskData): number {
  const haystack = [
    data.title,
    data.industry,
    data.bridgeRole,
    ...data.safeSkills,
    ...data.reskillingSuggestions,
    role.adjacentRoleHint,
    role.title,
    ...role.skills,
  ].join(" ").toLowerCase();

  const needles = [
    data.title,
    data.industry,
    data.bridgeRole,
    ...data.reskillingSuggestions,
  ].join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3);

  return needles.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function reviewStatusForContext(
  context: TransitionProofPack["context"],
  sectionId: ProofPackSectionId,
  hasBlockingRows = false
): ReportReviewStatus {
  if (hasBlockingRows) return "staff_review_required";
  if (context === "workforce") return sectionId === "client_delivery" ? "staff_review_required" : "staff_reviewed";
  if (context === "coach") return sectionId === "client_delivery" ? "client_ready" : "coach_reviewed";
  return sectionId === "client_delivery" ? "staff_review_required" : "auto_generated";
}

function buildSectionReviews(input: {
  context: TransitionProofPack["context"];
  evidenceCards: EvidenceCard[];
  unmappedCount?: number;
}): ProofPackSectionReview[] {
  const hasUnmappedRows = (input.unmappedCount || 0) > 0;
  const evidenceCardIds = input.evidenceCards.map((card) => card.id);
  const reviewerRole = input.context === "workforce"
    ? "Commercial staff reviewer"
    : input.context === "coach"
      ? "Coach or counselor reviewer"
      : "Coach or staff reviewer before institutional delivery";
  const requiredForInstitutionalDelivery = input.context !== "individual" || hasUnmappedRows;
  const baseSourceIds = input.context === "workforce"
    ? ["nist-ai-rmf", "ada-ai-hiring-guidance", "onet"]
    : ["nist-ai-rmf", "bls-ai-mlr-2025", "onet"];

  const sections: Array<Omit<ProofPackSectionReview, "reviewStatus" | "clientReady" | "allowedNextStatuses">> = [
    {
      sectionId: "decision_boundary",
      sectionTitle: "Decision Boundary",
      requiredForInstitutionalDelivery: true,
      reviewerRole,
      blockingReason: "Employment-decision, layoff, and local-context boundaries must be visible before sharing.",
      caveat: "This report supports planning conversations only and cannot be used as hiring, firing, promotion, or layoff evidence.",
      sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance"],
      evidenceCardIds,
      acceptanceCriteria: [
        "Decision boundary visible in report",
        "No employment-decision recommendation present",
        "No layoff prediction language present",
      ],
    },
    {
      sectionId: "task_exposure_split",
      sectionTitle: "Task Exposure Split",
      requiredForInstitutionalDelivery,
      reviewerRole,
      blockingReason: "Tasks must match the client's actual role mix before client-ready guidance.",
      caveat: "Occupation task data is representative and may not match a specific person, employer, region, or workflow.",
      sourceIds: baseSourceIds,
      evidenceCardIds: evidenceCardIds.filter((id) => id.includes("task") || id.includes("workforce")),
      acceptanceCriteria: [
        "Task buckets are visible",
        "Automatable work is separated from AI-assisted and human-led work",
        "Client-specific task fit has reviewer confirmation",
      ],
    },
    {
      sectionId: "skill_change_ledger",
      sectionTitle: "Skill Change Ledger",
      requiredForInstitutionalDelivery,
      reviewerRole,
      blockingReason: "Skill actions need client, program, or local market validation before delivery.",
      caveat: "Skill labels are planning signals until validated with local postings, program goals, or licensed provider data.",
      sourceIds: ["wef-foj-2025", "esco", "lightcast"],
      evidenceCardIds: evidenceCardIds.filter((id) => id.includes("skill")),
      acceptanceCriteria: [
        "Skill status and action are visible",
        "Provider-backed signals are caveated",
        "Learning recommendation is not presented as guaranteed placement",
      ],
    },
    {
      sectionId: "ai_era_role_radar",
      sectionTitle: "AI-Era Role Radar",
      requiredForInstitutionalDelivery,
      reviewerRole,
      blockingReason: "Emerging roles need posting, taxonomy, or employer validation before client-ready positioning.",
      caveat: "Role radar titles are emerging signals, not official occupations or guaranteed job titles.",
      sourceIds: ["wef-foj-2025", "ai-workforce-consortium-2025", "anthropic-economic-index", "openai-gdpval", "llm-output"],
      evidenceCardIds: evidenceCardIds.filter((id) => id.includes("role")),
      acceptanceCriteria: [
        "Emerging role status is visible",
        "Role-level review status is visible",
        "Taxonomy and posting validation status are visible",
        "No role is labeled official unless taxonomy-mapped",
        "Reviewer has validated search terms before client use",
      ],
    },
    {
      sectionId: "evidence_cards",
      sectionTitle: "Evidence Cards",
      requiredForInstitutionalDelivery: true,
      reviewerRole,
      blockingReason: "Every major recommendation must include source, confidence, caveat, timestamp, and does-not-prove boundary.",
      caveat: "Evidence cards document source boundaries; they do not certify market outcomes.",
      sourceIds: ["nist-ai-rmf", "bls-ai-mlr-2025", "llm-output"],
      evidenceCardIds,
      acceptanceCriteria: [
        "Every evidence card has source IDs",
        "Every evidence card has a does-not-prove statement",
        "Review status is visible on each card",
      ],
    },
    {
      sectionId: "client_delivery",
      sectionTitle: "Client Delivery Readiness",
      requiredForInstitutionalDelivery: true,
      reviewerRole,
      blockingReason: "The artifact needs reviewer approval before institutional delivery.",
      caveat: hasUnmappedRows
        ? `${input.unmappedCount} workforce row(s) still need SOC/O*NET mapping review.`
        : "Client-ready status means reviewed for this artifact, not validated as a labor-market prediction.",
      sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "wcag-22"],
      evidenceCardIds,
      acceptanceCriteria: [
        "Reviewer role is named",
        "Blocking rows or caveats are visible",
        "Client-ready status is not implied until review is complete",
      ],
    },
  ];

  return sections.map((section) => {
    const reviewStatus = reviewStatusForContext(input.context, section.sectionId, hasUnmappedRows && section.requiredForInstitutionalDelivery);
    const clientReady = reviewStatus === "client_ready" || reviewStatus === "staff_reviewed" || reviewStatus === "coach_reviewed";
    return {
      ...section,
      reviewStatus,
      clientReady,
      allowedNextStatuses: reviewStatus === "client_ready"
        ? ["client_ready"]
        : ["staff_review_required", "staff_reviewed", "client_ready"],
    };
  });
}

export function getAiEraRoleRadar(limit = AI_ERA_ROLE_RADAR.length): AiEraRole[] {
  return AI_ERA_ROLE_RADAR.slice(0, limit);
}

export function getTransitionProofPackReviewMetadata(pack: TransitionProofPack): Record<string, unknown> {
  const pendingSections = pack.sectionReviews.filter((section) => !section.clientReady);
  return {
    generatedAt: pack.generatedAt,
    context: pack.context,
    reviewStatus: pack.reviewStatus,
    clientReady: pendingSections.length === 0,
    pendingSectionCount: pendingSections.length,
    sections: pack.sectionReviews.map((section) => ({
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      reviewStatus: section.reviewStatus,
      requiredForInstitutionalDelivery: section.requiredForInstitutionalDelivery,
      reviewerRole: section.reviewerRole,
      clientReady: section.clientReady,
      blockingReason: section.clientReady ? null : section.blockingReason,
      caveat: section.caveat,
      sourceIds: section.sourceIds,
      evidenceCardIds: section.evidenceCardIds,
      acceptanceCriteria: section.acceptanceCriteria,
      allowedNextStatuses: section.allowedNextStatuses,
    })),
  };
}

export function buildOccupationTransitionProofPack(
  data: OccupationRiskData,
  context: "individual" | "coach" = "individual",
  generatedAt: Date = new Date()
): TransitionProofPack {
  const generatedAtIso = generatedAt.toISOString();
  const reviewStatus: ReportReviewStatus = context === "coach" ? "coach_reviewed" : "auto_generated";
  const taskExposure: TaskExposureItem[] = [
    ...data.highRiskTasks.map((task, index) => {
      const score = parseTaskScore(task, data.overallRisk);
      return {
        task: stripScoreLabel(task),
        bucket: bucketForScore(score),
        exposureScore: score,
        weighting: buildSeedTaskWeighting(score, index, "Seed occupation task score parsed from the commercial SEO task list."),
        rationale: score >= 80
          ? "Routine or structured work that current AI/workflow automation can often support heavily."
          : "Work likely changes through AI assistance but still needs human context and validation.",
        sourceIds: ["onet", "anthropic-observed-exposure", "bls-ai-mlr-2025"],
      };
    }),
    ...data.safeSkills.slice(0, 3).map((skill, index) => ({
      task: skill,
      bucket: "human_led" as const,
      exposureScore: Math.max(5, 100 - data.overallRisk),
      weighting: buildSeedTaskWeighting(
        Math.max(20, 100 - data.overallRisk),
        index,
        "Human-led preservation proxy from the occupation's safe-skill list."
      ),
      rationale: "Human-led capability that depends on accountability, context, judgment, or relationship quality.",
      sourceIds: ["onet", "bls-ai-mlr-2025", "wef-foj-2025"],
    })),
    ...data.reskillingSuggestions.slice(0, 2).map((skill, index) => ({
      task: `Build capability in ${skill}`,
      bucket: "emerging" as const,
      exposureScore: 0,
      weighting: buildSeedTaskWeighting(
        35,
        index,
        "Emerging transition priority proxy from the occupation's reskilling suggestion list."
      ),
      rationale: "Emerging work-transition capability that should be validated against local demand before client action.",
      sourceIds: ["wef-foj-2025", "lightcast", "llm-output"],
    })),
  ];

  const skillLedger: SkillChangeItem[] = [
    ...data.highRiskTasks.slice(0, 3).map((task) => ({
      skill: stripScoreLabel(task),
      status: "declining" as const,
      action: "replace" as const,
      rationale: "Routine execution should be converted into system ownership, review, or exception handling.",
      sourceIds: ["anthropic-observed-exposure", "bls-ai-mlr-2025", "oecd-skills-outlook-2025"],
      confidence: "medium" as const,
      reviewStatus,
      caveat: "Declining means routine execution is less defensible as a standalone skill; it does not mean the whole occupation or worker is obsolete.",
    })),
    ...data.safeSkills.map((skill) => ({
      skill,
      status: "stable" as const,
      action: "protect" as const,
      rationale: "Keep and deepen this skill because it remains tied to human judgment or trust.",
      sourceIds: ["onet", "wef-foj-2025"],
      confidence: "medium" as const,
      reviewStatus,
      caveat: "Stable skills still need role-specific validation because employer workflows and accountability requirements differ.",
    })),
    {
      skill: `${data.title} AI workflow supervision`,
      status: "changing" as const,
      action: "upgrade" as const,
      rationale: "The work is likely to shift from manual execution toward AI-assisted review, exception handling, and workflow ownership.",
      sourceIds: ["wef-foj-2025", "oecd-skills-outlook-2025", "anthropic-observed-exposure"],
      confidence: "medium" as const,
      reviewStatus,
      caveat: "Changing skills need a client or employer workflow check before being turned into a training plan.",
    },
    {
      skill: `Local demand for ${data.bridgeRole} transition skills`,
      status: "unknown" as const,
      action: "learn_next" as const,
      rationale: "Local job-posting demand is not yet validated in this open-data proof pack.",
      sourceIds: ["lightcast", "esco", "llm-output"],
      confidence: "low" as const,
      reviewStatus: "staff_review_required" as const,
      caveat: "Unknown means the report needs local posting, program, or licensed provider validation before client-ready prioritization.",
    },
    ...data.reskillingSuggestions.map((skill) => ({
      skill,
      status: "growing" as const,
      action: "learn_next" as const,
      rationale: "Useful next skill for moving from exposure awareness into transition action.",
      sourceIds: ["wef-foj-2025", "oecd-skills-outlook-2025", "lightcast", "esco"],
      confidence: "medium" as const,
      reviewStatus,
      caveat: "Growing skill status is directional until checked against local postings, program outcomes, or licensed market data.",
    })),
  ].slice(0, 12);

  const aiEraRoles = AI_ERA_ROLE_RADAR
    .slice()
    .sort((a, b) => roleRelevanceScore(b, data) - roleRelevanceScore(a, data))
    .slice(0, 5);

  const evidenceCards = [
    createEvidenceCard({
      id: "task-exposure-boundary",
      claim: "Task exposure is different from job loss or layoff prediction.",
      sourceIds: ["onet", "anthropic-observed-exposure", "bls-ai-mlr-2025"],
      confidence: "high",
      caveat: "Occupation tasks are representative and may not match a specific person or employer.",
      doesNotProve: "That this person will lose work, should change jobs, or should be screened differently.",
      reviewStatus,
      generatedAt,
      action: "Use the task split as a planning conversation starter.",
    }),
    createEvidenceCard({
      id: "task-weighting-method",
      claim: "Task prioritization should account for importance and frequency, not exposure score alone.",
      sourceIds: ["onet", "bls-ai-mlr-2025", "nist-ai-rmf"],
      confidence: "medium",
      caveat: "Current report weights use transparent seed proxies unless checksum-verified O*NET Task Ratings are attached to the artifact.",
      doesNotProve: "That the displayed priority weight is true time allocation for a worker, employer, or occupation.",
      reviewStatus,
      generatedAt,
      action: "Use the O*NET 30.3 Task Ratings ingest and checksum gate before making task-time claims.",
    }),
    createEvidenceCard({
      id: "skill-change-ledger",
      claim: "Skills should be separated into protect, upgrade, replace, and learn-next actions.",
      sourceIds: ["wef-foj-2025", "oecd-skills-outlook-2025", "esco", "lightcast"],
      confidence: "medium",
      caveat: "Provider-backed job-posting signals remain adapter-ready until licensed data is integrated.",
      doesNotProve: "That every listed skill is currently demanded in the user's local labor market.",
      reviewStatus,
      generatedAt,
      action: "Validate skill priorities with local postings, coach review, or workforce program context.",
    }),
    createEvidenceCard({
      id: "ai-era-role-radar",
      claim: "AI-era role options are emerging transition signals, not official occupation promises.",
      sourceIds: ["wef-foj-2025", "ai-workforce-consortium-2025", "anthropic-economic-index", "openai-gdpval", "llm-output"],
      confidence: "medium",
      caveat: "Emerging roles need posting-level validation before being marketed as stable career targets.",
      doesNotProve: "That these titles exist in every region, employer, or industry.",
      reviewStatus,
      generatedAt,
      action: "Use role radar to pick search terms and learning themes.",
    }),
  ];

  return {
    generatedAt: generatedAtIso,
    reviewStatus,
    context,
    title: `${data.title} AI Work Transition Proof Pack`,
    summary: `This proof pack separates ${data.title} exposure into task changes, skill actions, emerging role options, and review boundaries.`,
    taskExposure,
    skillLedger,
    aiEraRoles,
    evidenceCards,
    sectionReviews: buildSectionReviews({ context, evidenceCards }),
    nextActions: [
      "Validate which listed tasks are actually part of the current job.",
      "Prioritize human-led skills before making transition decisions.",
      "Use AI-era roles as search and learning signals, not guaranteed job titles.",
      "Get coach or staff review before sharing as client-ready guidance.",
    ],
  };
}

export function buildWorkforceTransitionProofPack(
  rows: WorkforceProofPackRow[],
  generatedAt: Date = new Date()
): TransitionProofPack {
  const generatedAtIso = generatedAt.toISOString();
  const reviewStatus: ReportReviewStatus = "staff_review_required";
  const priorityRows = rows.slice().sort((a, b) => (b.apoScore * b.headcount) - (a.apoScore * a.headcount)).slice(0, 8);
  const unmappedCount = rows.filter((row) => !row.socCode).length;
  const maxWeightedExposure = priorityRows.reduce(
    (max, row) => Math.max(max, row.apoScore * Math.max(1, row.headcount)),
    1
  );

  const taskExposure: TaskExposureItem[] = priorityRows.map((row) => ({
    task: `${row.department}: ${row.role}`,
    bucket: row.apoScore >= 70 ? "automatable" : row.apoScore >= 50 ? "ai_assisted" : "human_led",
    exposureScore: row.apoScore,
    weighting: buildWorkforceTaskWeighting(row, maxWeightedExposure),
    rationale: row.socCode
      ? "Mapped row can be reviewed against SOC/O*NET and workforce context."
      : "Unmapped row must be human-reviewed before client-ready recommendations.",
    sourceIds: row.socCode ? ["onet", "bls-ai-mlr-2025"] : ["llm-output", "onet"],
  }));

  const skillLedger: SkillChangeItem[] = [
    {
      skill: "AI output verification",
      status: "growing",
      action: "learn_next",
      rationale: "High-exposure workflows need people who can evaluate generated outputs and catch failure modes.",
      sourceIds: ["anthropic-observed-exposure", "openai-gdpval", "nist-ai-rmf"],
      confidence: "medium",
      reviewStatus,
      caveat: "Growing demand is directional until checked against local role design and current postings.",
    },
    {
      skill: "Exception handling",
      status: "growing",
      action: "upgrade",
      rationale: "Human value shifts toward exceptions when routine workflow becomes automatable.",
      sourceIds: ["bls-ai-mlr-2025", "wef-foj-2025", "oecd-skills-outlook-2025"],
      confidence: "medium",
      reviewStatus,
      caveat: "Exception work must be validated against the team's actual queue design and escalation policy.",
    },
    {
      skill: "AI governance documentation",
      status: "growing",
      action: "learn_next",
      rationale: "Institutional pilots need documented boundaries, review states, and evidence trails.",
      sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "wcag-22"],
      confidence: "high",
      reviewStatus,
      caveat: "Governance documentation is necessary for pilots but does not certify legal or regulatory compliance.",
    },
    {
      skill: "Role-level workflow redesign",
      status: "changing",
      action: "upgrade",
      rationale: "AI adoption changes task bundles, handoffs, review points, and the skills needed to supervise the work.",
      sourceIds: ["oecd-skills-outlook-2025", "wef-foj-2025", "nist-ai-rmf"],
      confidence: "medium",
      reviewStatus,
      caveat: "Changing status needs manager and worker validation before being converted into a department plan.",
    },
    {
      skill: "Manual data transfer",
      status: "declining",
      action: "replace",
      rationale: "Manual movement of structured data is often a strong candidate for workflow redesign.",
      sourceIds: ["anthropic-observed-exposure", "bls-ai-mlr-2025"],
      confidence: "medium",
      reviewStatus,
      caveat: "Declining applies to routine manual transfer, not to accountable data stewardship or exception review.",
    },
    {
      skill: "Stakeholder communication",
      status: "stable",
      action: "protect",
      rationale: "Workforce transition still needs human context, trust, and change management.",
      sourceIds: ["wef-foj-2025", "nist-ai-rmf"],
      confidence: "medium",
      reviewStatus,
      caveat: "Stable skills still need team-specific examples before training budgets are assigned.",
    },
    {
      skill: "Local posting demand by department",
      status: "unknown",
      action: "learn_next",
      rationale: "The CSV audit does not include current local postings or licensed provider demand signals.",
      sourceIds: ["lightcast", "esco", "llm-output"],
      confidence: "low",
      reviewStatus: "staff_review_required",
      caveat: "Unknown status must remain visible until live posting validation or licensed market data is integrated.",
    },
  ];

  const evidenceCards = [
    createEvidenceCard({
      id: "workforce-task-exposure",
      claim: "Workforce exposure should be interpreted at role/task level, not as individual employee ranking.",
      sourceIds: ["bls-ai-mlr-2025", "anthropic-observed-exposure", "onet"],
      confidence: "high",
      caveat: "CSV rows may not reflect real job design, task time allocation, or local policy constraints.",
      doesNotProve: "That any individual employee should be hired, fired, promoted, or compensated differently.",
      reviewStatus,
      generatedAt,
      action: "Validate SOC mappings and role descriptions with HR before sharing externally.",
    }),
    createEvidenceCard({
      id: "workforce-review-boundary",
      claim: "Unmapped or low-confidence rows require staff review before client-ready delivery.",
      sourceIds: ["onet", "ada-ai-hiring-guidance", "nist-ai-rmf"],
      confidence: "high",
      caveat: `${unmappedCount} row(s) currently require mapping/review before production use.`,
      doesNotProve: "That deterministic title suggestions are correct without reviewer confirmation.",
      reviewStatus,
      generatedAt,
      action: "Resolve review queue rows and preserve reviewer notes.",
    }),
    createEvidenceCard({
      id: "workforce-skill-transition",
      claim: "Reskilling priorities should focus on verification, exception handling, and governed AI workflow ownership.",
      sourceIds: ["wef-foj-2025", "oecd-skills-outlook-2025", "lightcast", "anthropic-economic-index"],
      confidence: "medium",
      caveat: "Skill demand needs current job-posting or employer-specific validation before budget allocation.",
      doesNotProve: "That a particular training vendor, course, or redeployment path will succeed.",
      reviewStatus,
      generatedAt,
      action: "Attach department-level learning paths only after pilot review.",
    }),
  ];

  return {
    generatedAt: generatedAtIso,
    reviewStatus,
    context: "workforce",
    title: "Workforce AI Work Transition Proof Pack",
    summary: "This proof pack separates workforce exposure, skill-change priorities, emerging role options, and institutional review boundaries.",
    taskExposure,
    skillLedger,
    aiEraRoles: AI_ERA_ROLE_RADAR.slice(0, 6),
    evidenceCards,
    sectionReviews: buildSectionReviews({ context: "workforce", evidenceCards, unmappedCount }),
    nextActions: [
      "Validate every unmapped SOC/O*NET row before executive use.",
      "Split automation opportunity from employment decision-making.",
      "Prioritize department-level pilots around review, exception, and governance skills.",
      "Attach signed artifact delivery and reviewer notes before paid enterprise pilots.",
    ],
  };
}

function renderReviewStatusLabel(status: ReportReviewStatus): string {
  return REVIEW_STATUS_LABELS[status] || status;
}

function renderTaskBucketLabel(bucket: TaskExposureBucket): string {
  const labels: Record<TaskExposureBucket, string> = {
    automatable: "Automatable",
    ai_assisted: "AI-assisted",
    human_led: "Human-led",
    emerging: "Emerging",
  };
  return labels[bucket];
}

function renderSkillStatusLabel(status: SkillChangeStatus): string {
  const labels: Record<SkillChangeStatus, string> = {
    growing: "Growing",
    stable: "Stable",
    declining: "Declining",
    changing: "Changing",
    unknown: "Unknown",
  };
  return labels[status];
}

function renderSkillActionLabel(action: SkillAction): string {
  const labels: Record<SkillAction, string> = {
    protect: "Protect",
    upgrade: "Upgrade",
    replace: "Replace",
    learn_next: "Learn next",
  };
  return labels[action];
}

function renderRoleTaxonomyStatusLabel(status: AiEraRoleTaxonomyStatus): string {
  const labels: Record<AiEraRoleTaxonomyStatus, string> = {
    "emerging-not-taxonomy-mapped": "Emerging, not taxonomy-mapped",
    "taxonomy-mapped": "Taxonomy-mapped",
  };
  return labels[status];
}

function renderRoleMarketValidationStatusLabel(status: AiEraRoleMarketValidationStatus): string {
  const labels: Record<AiEraRoleMarketValidationStatus, string> = {
    "needs-posting-validation": "Needs posting validation",
    "posting-validated": "Posting-validated",
    "provider-validated": "Provider-validated",
  };
  return labels[status];
}

function renderTaskWeighting(task: TaskExposureItem): string {
  const methodLabels: Record<TaskWeightingMethod, string> = {
    seed_score_proxy: "Seed proxy",
    onet_task_ratings_ready: "O*NET Task Ratings-ready",
    workforce_headcount_weighted: "Headcount-weighted",
  };
  return `${methodLabels[task.weighting.method]}: ${Math.round(task.weighting.priorityWeight * 100)} priority, ${task.weighting.importanceProxy}/5 importance proxy, ${task.weighting.frequencyProxy} frequency proxy. ${task.weighting.evidenceBasis} Caveat: ${task.weighting.caveat}`;
}

export function renderTransitionProofPackHtml(pack: TransitionProofPack): string {
  const reviewMetadataJson = escapeHtml(JSON.stringify(getTransitionProofPackReviewMetadata(pack)));

  return `
    <section class="transition-proof-pack" data-proof-pack="ai-work-transition">
      <template data-proof-pack-review-metadata="true">${reviewMetadataJson}</template>
      <div class="proof-pack-heading">
        <div>
          <h2>${escapeHtml(pack.title)}</h2>
          <p>${escapeHtml(pack.summary)}</p>
        </div>
        <span class="proof-review-state review-state">${escapeHtml(pack.reviewStatus)}</span>
      </div>

      <h3>Human Review Workflow</h3>
      <table class="proof-table proof-review-workflow" data-review-workflow="section-readiness">
        <thead>
          <tr><th>Section</th><th>Review state</th><th>Required before institutional delivery</th><th>Client ready?</th><th>Blocking reason / caveat</th></tr>
        </thead>
        <tbody>
          ${pack.sectionReviews.map((section) => `
            <tr data-review-section-id="${escapeHtml(section.sectionId)}" data-review-status="${escapeHtml(section.reviewStatus)}">
              <td><strong>${escapeHtml(section.sectionTitle)}</strong><br/><span>${escapeHtml(section.reviewerRole)}</span></td>
              <td><span class="review-state">${escapeHtml(renderReviewStatusLabel(section.reviewStatus))}</span></td>
              <td>${section.requiredForInstitutionalDelivery ? "Yes" : "No"}</td>
              <td>${section.clientReady ? "Yes" : "No"}</td>
              <td>${escapeHtml(section.clientReady ? section.caveat : section.blockingReason)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h3>Task Exposure Split</h3>
      <table class="proof-table task-exposure-split">
        <thead>
          <tr><th>Task / role signal</th><th>Bucket</th><th>Score</th><th>Weight basis</th><th>Rationale</th></tr>
        </thead>
        <tbody>
          ${pack.taskExposure.slice(0, 10).map((task) => `
            <tr>
              <td>${escapeHtml(task.task)}</td>
              <td><span class="proof-pill proof-pill-${escapeHtml(task.bucket)}">${escapeHtml(renderTaskBucketLabel(task.bucket))}</span></td>
              <td>${task.bucket === "emerging" ? "n/a" : `${Math.round(task.exposureScore)}%`}</td>
              <td>${escapeHtml(renderTaskWeighting(task))}</td>
              <td>${escapeHtml(task.rationale)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h3>Skill Change Ledger</h3>
      <table class="proof-table skill-change-ledger">
        <thead>
          <tr><th>Skill</th><th>Status</th><th>Action</th><th>Confidence</th><th>Review</th><th>Source caveat</th><th>Rationale</th></tr>
        </thead>
        <tbody>
          ${pack.skillLedger.slice(0, 10).map((skill) => `
            <tr>
              <td>${escapeHtml(skill.skill)}</td>
              <td><span class="proof-pill proof-pill-${escapeHtml(skill.status)}">${escapeHtml(renderSkillStatusLabel(skill.status))}</span></td>
              <td>${escapeHtml(renderSkillActionLabel(skill.action))}</td>
              <td>${escapeHtml(skill.confidence)} confidence</td>
              <td><span class="review-state">${escapeHtml(renderReviewStatusLabel(skill.reviewStatus))}</span></td>
              <td>${escapeHtml(skill.caveat)}<br/><span>Sources: ${skill.sourceIds.map(escapeHtml).join(", ")}</span></td>
              <td>${escapeHtml(skill.rationale)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h3>AI-Era Role Radar</h3>
      <div class="ai-era-role-radar">
        ${pack.aiEraRoles.map((role) => `
          <article class="ai-era-role-card">
            <div class="ai-era-role-card-header">
              <strong>${escapeHtml(role.title)}</strong>
              <span>${escapeHtml(role.confidence)} confidence</span>
            </div>
            <p>${escapeHtml(role.whyItMatters)}</p>
            <p><strong>Status:</strong> ${escapeHtml(role.status)} | <strong>Review:</strong> ${escapeHtml(renderReviewStatusLabel(role.reviewStatus))}</p>
            <p><strong>Role validation:</strong> ${escapeHtml(renderRoleTaxonomyStatusLabel(role.taxonomyStatus))}; ${escapeHtml(renderRoleMarketValidationStatusLabel(role.marketValidationStatus))}</p>
            <p><strong>Validation note:</strong> ${escapeHtml(role.validationNote)}</p>
            <p><strong>Adjacent from:</strong> ${escapeHtml(role.adjacentRoleHint)}</p>
            <p><strong>Skills:</strong> ${role.skills.map(escapeHtml).join(", ")}</p>
            <p><strong>Search terms:</strong> ${role.searchTerms.map(escapeHtml).join(", ")}</p>
            <p><strong>Sources:</strong> ${role.sourceIds.map(escapeHtml).join(", ")}</p>
            <p class="role-caveat"><strong>Source caveat:</strong> ${escapeHtml(role.caveat)}</p>
          </article>
        `).join("")}
      </div>

      <h3>Next Actions</h3>
      <ol class="proof-next-actions">
        ${pack.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
      </ol>

      ${renderEvidenceCardsHtml(pack.evidenceCards, "Proof Pack Evidence Cards")}
    </section>
  `;
}

export function getTransitionProofPackCss(): string {
  return `
    ${getEvidenceCardCss()}
    .transition-proof-pack { margin-top: 28px; padding: 18px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; }
    .transition-proof-pack h2, .transition-proof-pack h3 { margin: 0 0 10px; }
    .transition-proof-pack h3 { font-size: 15px; margin-top: 18px; }
    .proof-pack-heading { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
    .proof-pack-heading p { color: #475569; font-size: 13px; margin: 4px 0 0; }
    .proof-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
    .proof-table th, .proof-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    .proof-table th { background: #f1f5f9; }
    .proof-pill { border-radius: 999px; display: inline-block; font-size: 10px; font-weight: 800; padding: 3px 7px; text-transform: uppercase; white-space: nowrap; }
    .proof-pill-automatable, .proof-pill-declining, .proof-pill-replace { background: #fee2e2; color: #991b1b; }
    .proof-pill-ai_assisted, .proof-pill-changing, .proof-pill-upgrade { background: #fef3c7; color: #92400e; }
    .proof-pill-human_led, .proof-pill-stable, .proof-pill-protect { background: #dcfce7; color: #166534; }
    .proof-pill-emerging, .proof-pill-growing, .proof-pill-learn_next { background: #dbeafe; color: #1d4ed8; }
    .proof-pill-unknown { background: #e2e8f0; color: #334155; }
    .ai-era-role-radar { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ai-era-role-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12px; }
    .ai-era-role-card p { margin: 7px 0; }
    .ai-era-role-card-header { display: flex; gap: 8px; justify-content: space-between; }
    .ai-era-role-card-header span, .role-caveat { color: #64748b; }
    .proof-next-actions { margin: 8px 0 0; padding-left: 20px; font-size: 12px; }
    .proof-next-actions li { margin: 5px 0; }
    @media (max-width: 760px) {
      .proof-pack-heading { display: block; }
      .ai-era-role-radar { grid-template-columns: 1fr; }
      .proof-table { font-size: 11px; }
    }
  `;
}
