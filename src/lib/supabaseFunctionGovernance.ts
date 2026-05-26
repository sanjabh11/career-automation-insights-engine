export type FunctionGovernanceScope =
  | "commercial-core"
  | "commercial-payment"
  | "public-utility"
  | "legacy-archive"
  | "external-review";

export type FunctionGovernanceAction =
  | "keep"
  | "harden"
  | "retire-after-approval"
  | "separate-project"
  | "review";

export interface SupabaseFunctionGovernanceSummary {
  projectRef: string;
  capturedAt: string;
  activeFunctionCount: number;
  noJwtFunctionCount: number;
  blocker: string;
  nonDestructiveRule: string;
}

export interface SupabaseFunctionGovernanceItem {
  slug: string;
  liveVerifyJwt: boolean;
  scope: FunctionGovernanceScope;
  action: FunctionGovernanceAction;
  launchImpact: string;
  risk: string;
  nextStep: string;
  requiredEvidence: string[];
  launchDecision: string;
  maturity: number;
  deleteCommand?: string;
}

export interface SupabaseFunctionPortfolioGroup {
  group: string;
  slugs: string[];
  commercialNeed: string;
  recommendedAction: string;
  maturity: number;
}

export const supabaseFunctionGovernanceSummary: SupabaseFunctionGovernanceSummary = {
  projectRef: "kvunnankqgfokeufvsrv",
  capturedAt: "2026-05-26",
  activeFunctionCount: 100,
  noJwtFunctionCount: 20,
  blocker:
    "Fresh 2026-05-26 redeploy attempts for create-checkout-session and stripe-webhook returned Supabase 402 function-count/spend-cap errors.",
  nonDestructiveRule:
    "Do not delete live functions automatically. Delete commands are approval-ready only and must be run one slug at a time after owner review.",
};

export const immediateFunctionRetirementCandidates: SupabaseFunctionGovernanceItem[] = [
  {
    slug: "stripe-checkout",
    liveVerifyJwt: false,
    scope: "commercial-payment",
    action: "retire-after-approval",
    launchImpact: "Superseded by create-checkout-session, which is deployed with JWT verification.",
    risk: "Legacy live function is public/no-JWT and trusts client-supplied userId.",
    nextStep: "After owner approval, delete this slug to free one function slot and reduce payment attack surface.",
    requiredEvidence: [
      "No production frontend route calls stripe-checkout.",
      "No Stripe dashboard, cron, or partner webhook points to stripe-checkout.",
      "A one-slug deletion approval and post-delete function-list proof are captured.",
    ],
    launchDecision: "Block paid launch until retired or proven unreachable.",
    maturity: 4.4,
    deleteCommand:
      "env -u SUPABASE_ACCESS_TOKEN supabase functions delete stripe-checkout --project-ref kvunnankqgfokeufvsrv --yes",
  },
  {
    slug: "stripe-portal",
    liveVerifyJwt: false,
    scope: "commercial-payment",
    action: "retire-after-approval",
    launchImpact: "Superseded by create-portal-session, which is deployed with JWT verification.",
    risk: "Legacy live function is public/no-JWT and trusts client-supplied userId.",
    nextStep: "After owner approval, delete this slug to free one function slot and reduce billing-portal exposure.",
    requiredEvidence: [
      "No production frontend route calls stripe-portal.",
      "No billing-dashboard or support workflow points to stripe-portal.",
      "A one-slug deletion approval and post-delete function-list proof are captured.",
    ],
    launchDecision: "Block paid launch until retired or proven unreachable.",
    maturity: 4.4,
    deleteCommand:
      "env -u SUPABASE_ACCESS_TOKEN supabase functions delete stripe-portal --project-ref kvunnankqgfokeufvsrv --yes",
  },
];

export const publicNoJwtFunctionReviewItems: SupabaseFunctionGovernanceItem[] = [
  {
    slug: "stripe-webhook",
    liveVerifyJwt: false,
    scope: "commercial-payment",
    action: "harden",
    launchImpact: "Must remain public for Stripe, but should rely on signature verification only.",
    risk: "Current live version verifies Stripe signature but has not yet received the new credit-purchase fulfillment path.",
    nextStep: "After function slots are freed or the cap is raised, redeploy stripe-webhook with credit_purchase handling and keep verify_jwt disabled.",
    requiredEvidence: [
      "Stripe signature verification remains the only public auth boundary.",
      "Stripe test-mode replay proves credit_purchase fulfillment.",
      "Webhook logs show failed unsigned requests are rejected.",
    ],
    launchDecision: "Keep public only as a signed Stripe webhook; block credit sales until replay proof passes.",
    maturity: 3.5,
  },
  {
    slug: "ai-skill-analysis",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports skill analysis experiences that can feed proof-pack recommendations.",
    risk: "Public AI analysis needs cost ceilings, prompt-injection controls, and evidence-card boundaries before outreach scale.",
    nextStep: "Keep public only if throttling, logging, and source/caveat response fields are verified.",
    requiredEvidence: [
      "Rate limit or cost ceiling is documented.",
      "Prompt-injection and oversized-input handling are verified.",
      "Responses include source and caveat fields before they enter reports.",
    ],
    launchDecision: "Manual demo only until rate, cost, and caveat proof is captured.",
    maturity: 3.0,
  },
  {
    slug: "calculate-apo",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports public discovery and SEO-style occupation exploration.",
    risk: "Public computation endpoint needs documented rate limits, abuse telemetry, and origin/cost controls.",
    nextStep: "Keep public only if rate-limit evidence and cost ceiling are documented.",
    requiredEvidence: [
      "Public request validation and bounded input handling are documented.",
      "Rate limit or abuse telemetry is visible in logs or provider controls.",
      "Response caveats prevent treating APO as a layoff or employment-decision score.",
    ],
    launchDecision: "Keep for public discovery only with telemetry evidence attached.",
    maturity: 3.4,
  },
  {
    slug: "search-occupations",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports public search and onboarding flows.",
    risk: "Public query endpoint can be scraped or abused without throttling evidence.",
    nextStep: "Keep public if response size, query validation, and telemetry are verified.",
    requiredEvidence: [
      "Query length and response-size limits are verified.",
      "Telemetry can identify abnormal scraping or repeated empty searches.",
      "Search results stay informational and do not expose protected user data.",
    ],
    launchDecision: "Keep public for discovery if query validation and scraping telemetry are proven.",
    maturity: 3.5,
  },
  {
    slug: "analyze-occupation-tasks",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports occupation task insights.",
    risk: "Public task analysis should not expose expensive or uncaveated LLM execution.",
    nextStep: "Confirm deterministic fallback, rate limiting, and evidence-card caveats before scaled traffic.",
    requiredEvidence: [
      "Deterministic fallback path is documented for core task analysis.",
      "LLM-backed paths have cost controls or are gated.",
      "Task outputs carry source, confidence, and caveat metadata.",
    ],
    launchDecision: "Keep public only for bounded task insights; gate expensive generation paths.",
    maturity: 3.2,
  },
  {
    slug: "skill-recommendations",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports public skill recommendations.",
    risk: "Could be used as uncaveated career advice if detached from proof-pack boundaries.",
    nextStep: "Keep public only with source/caveat response fields and cost controls.",
    requiredEvidence: [
      "Recommendations include source IDs, caveats, and does-not-prove language.",
      "Provider/course links are clearly separated from outcome guarantees.",
      "Cost and rate controls are documented for public traffic.",
    ],
    launchDecision: "Keep public only as planning guidance with caveated outputs.",
    maturity: 3.2,
  },
  {
    slug: "calculate-learning-roi",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Can support buyer-facing learning ROI narratives if bounded as planning guidance.",
    risk: "Public ROI calculations can be overread as validated financial outcomes without assumptions and caveats.",
    nextStep: "Require assumption display, rate limits, and a clear does-not-prove boundary before marketing it.",
    requiredEvidence: [
      "ROI assumptions are returned or displayed with every result.",
      "Outputs explicitly avoid wage, job-placement, promotion, or payback guarantees.",
      "Public rate limit or cost ceiling is documented.",
    ],
    launchDecision: "Keep out of sales claims until assumptions and caveats are visible.",
    maturity: 3.0,
  },
  {
    slug: "content-moderation",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Can help keep user-submitted outreach or report text within safety boundaries.",
    risk: "A public moderation endpoint may expose cost or become an abuse target if not scoped.",
    nextStep: "Document caller surface, throttling, and whether this should be server-only.",
    requiredEvidence: [
      "Caller surface is documented as public, staff-only, or server-only.",
      "Abuse throttling and payload limits are verified.",
      "Moderation failures do not reveal sensitive prompt or policy internals.",
    ],
    launchDecision: "Review before scale; move server-side if public callers are not needed.",
    maturity: 3.1,
  },
  {
    slug: "cron-stream-processor",
    liveVerifyJwt: false,
    scope: "legacy-archive",
    action: "separate-project",
    launchImpact: "No direct proof-pack launch need has been established.",
    risk: "Public legacy processor adds function-count pressure and unclear attack surface.",
    nextStep: "Move to its original streaming project or retire after owner dependency review.",
    requiredEvidence: [
      "Dependency owner confirms no proof-pack route or cron depends on it.",
      "Original streaming project ownership is identified if retained.",
      "Archive or separate-project decision is recorded before paid launch.",
    ],
    launchDecision: "Separate or retire after owner review; do not count as proof-pack capability.",
    maturity: 2.4,
  },
  {
    slug: "generate-executive-report",
    liveVerifyJwt: false,
    scope: "commercial-core",
    action: "harden",
    launchImpact: "Potentially valuable for workforce executive proof-pack artifacts.",
    risk: "A public report-generation endpoint can expose paid-report value and uncaveated institutional outputs.",
    nextStep: "Redeploy with JWT or staff-only checks before using it in paid workforce pilots.",
    requiredEvidence: [
      "JWT or staff-only authorization is verified before paid use.",
      "Generated reports include source, caveat, and human-review states.",
      "Logs prove public unauthenticated report generation is rejected.",
    ],
    launchDecision: "Block paid workforce pilots until authenticated report generation is proven.",
    maturity: 3.0,
  },
  {
    slug: "generate-roadmap",
    liveVerifyJwt: false,
    scope: "commercial-core",
    action: "harden",
    launchImpact: "Can support transition-roadmap deliverables for individuals and workforce pilots.",
    risk: "Public roadmap generation can create uncaveated advice and provider-cost exposure.",
    nextStep: "Gate behind auth or enforce strict rate, source, caveat, and review-state controls.",
    requiredEvidence: [
      "Roadmaps include source IDs, assumptions, review state, and caveats.",
      "Provider/training suggestions avoid employment, pay, or placement guarantees.",
      "Public generation has rate and cost controls or is gated by auth.",
    ],
    launchDecision: "Use only inside reviewed proof packs until auth and caveat controls are proven.",
    maturity: 3.0,
  },
  {
    slug: "hris-sync",
    liveVerifyJwt: false,
    scope: "commercial-core",
    action: "harden",
    launchImpact: "Could support future workforce/L&D integrations.",
    risk: "HRIS sync should never be public/no-JWT because it can touch sensitive workforce data.",
    nextStep: "Disable public access or move behind authenticated enterprise integration controls before any buyer pilot.",
    requiredEvidence: [
      "Public invocation is disabled or protected by enterprise auth.",
      "No live workforce data is accepted through unauthenticated requests.",
      "Data processing, retention, and deletion boundaries are documented.",
    ],
    launchDecision: "Block enterprise pilots using HRIS sync until authentication and data boundaries are proven.",
    maturity: 2.3,
  },
  {
    slug: "market-intelligence",
    liveVerifyJwt: false,
    scope: "external-review",
    action: "harden",
    launchImpact: "Can strengthen local labor-market evidence if provider keys and provenance are controlled.",
    risk: "Public market-intelligence proxies can leak cost, quota, or unsupported market claims.",
    nextStep: "Require server-side caller controls and source freshness metadata before using it in sales claims.",
    requiredEvidence: [
      "Provider keys and quotas are never exposed to public callers.",
      "Every response includes source freshness and caveat metadata.",
      "Sales materials distinguish public/open data from licensed provider depth.",
    ],
    launchDecision: "Keep out of market-depth claims until provider controls and freshness metadata are proven.",
    maturity: 2.9,
  },
  {
    slug: "skill-gap-analysis",
    liveVerifyJwt: false,
    scope: "commercial-core",
    action: "harden",
    launchImpact: "Supports the core skill-change ledger and transition proof-pack value proposition.",
    risk: "Public skill-gap analysis can become uncaveated career assessment without human review and source metadata.",
    nextStep: "Gate behind auth or enforce evidence cards, review states, and rate limits before scaled outreach.",
    requiredEvidence: [
      "Skill gaps carry source IDs, confidence, and human-review state.",
      "Outputs are framed as planning guidance, not employment selection.",
      "Rate limits or authentication are documented before scaled outreach.",
    ],
    launchDecision: "Keep only as caveated planning output until auth/rate controls are proven.",
    maturity: 3.1,
  },
  {
    slug: "serpapi-jobs",
    liveVerifyJwt: false,
    scope: "external-review",
    action: "harden",
    launchImpact: "Can enrich market signals if API keys and quotas are protected.",
    risk: "Public search proxy can leak quota or trigger provider-cost abuse.",
    nextStep: "Require staff/server-side access or strict throttling before any outreach claim uses live job signals.",
    requiredEvidence: [
      "SerpAPI key remains server-side and quota protected.",
      "Public requests are throttled or moved behind staff/server-side access.",
      "Job-signal outputs include query, geography, timestamp, and does-not-prove caveats.",
    ],
    launchDecision: "Do not use in outreach claims until quota protection and provenance are proven.",
    maturity: 2.8,
  },
  {
    slug: "ai-career-coach",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Useful for demo coaching experiences.",
    risk: "Public AI advice endpoint needs safety, cost, prompt-injection, and caveat controls.",
    nextStep: "Gate behind auth or add strong rate/cost moderation before paid launch traffic.",
    requiredEvidence: [
      "Safety prompts and refusal behavior are verified for sensitive career decisions.",
      "Advice stays tied to source-labeled proof-pack boundaries.",
      "Cost, rate, and prompt-injection controls are documented.",
    ],
    launchDecision: "Demo only until safety, caveat, and cost controls are proven.",
    maturity: 2.9,
  },
  {
    slug: "cancel-subscription",
    liveVerifyJwt: false,
    scope: "commercial-payment",
    action: "harden",
    launchImpact: "Touches billing lifecycle and should not be public.",
    risk: "Public subscription mutation endpoints are not acceptable for commercial launch.",
    nextStep: "Replace with authenticated portal/session flow or redeploy with JWT after function-cap cleanup.",
    requiredEvidence: [
      "Unauthenticated cancellation requests are rejected or the slug is retired.",
      "Billing portal flow is the supported cancellation path.",
      "Stripe subscription state changes are proven through signed/authenticated flows.",
    ],
    launchDecision: "Block paid launch if this remains publicly mutable.",
    maturity: 2.5,
  },
  {
    slug: "resume-subscription",
    liveVerifyJwt: false,
    scope: "commercial-payment",
    action: "harden",
    launchImpact: "Touches billing lifecycle and should not be public.",
    risk: "Public subscription mutation endpoints are not acceptable for commercial launch.",
    nextStep: "Replace with authenticated portal/session flow or redeploy with JWT after function-cap cleanup.",
    requiredEvidence: [
      "Unauthenticated resume-subscription requests are rejected or the slug is retired.",
      "Billing portal or authenticated session flow is the supported reactivation path.",
      "Stripe subscription state changes are proven through signed/authenticated flows.",
    ],
    launchDecision: "Block paid launch if this remains publicly mutable.",
    maturity: 2.5,
  },
];

export const allPublicNoJwtFunctionGovernanceItems: SupabaseFunctionGovernanceItem[] = [
  ...immediateFunctionRetirementCandidates,
  ...publicNoJwtFunctionReviewItems,
];

export const classifiedPublicNoJwtFunctionCount = allPublicNoJwtFunctionGovernanceItems.length;

export const legacyFunctionPortfolioGroups: SupabaseFunctionPortfolioGroup[] = [
  {
    group: "Legacy payment slugs",
    slugs: ["stripe-checkout", "stripe-portal"],
    commercialNeed: "No longer needed once create-checkout-session and create-portal-session are confirmed in production.",
    recommendedAction: "Delete after owner approval; this frees slots needed for checkout/webhook redeploy.",
    maturity: 4.4,
  },
  {
    group: "Non-commercial legal functions",
    slugs: ["legal-oracle-unified", "legal-outcome-predict", "strategic-research-api"],
    commercialNeed: "Outside AI work-transition proof-pack scope.",
    recommendedAction: "Move to a separate Supabase project or archive after owner review.",
    maturity: 2.8,
  },
  {
    group: "Non-commercial energy/streaming functions",
    slugs: [
      "energy-data-api",
      "_delete_energy_functions_helper",
      "streaming-connector-register",
      "streaming-ingestion-hook",
      "streaming-health-sample-api",
      "streaming-llm-insights",
      "streaming-processor",
      "cron-stream-processor",
      "push_event",
    ],
    commercialNeed: "Outside the current commercialization wedge.",
    recommendedAction: "Separate or archive after checking whether any external demos still depend on them.",
    maturity: 2.6,
  },
  {
    group: "Non-commercial education and wellness functions",
    slugs: [
      "mental-health-analysis",
      "loneliness-connection-matching",
      "openstax-integration",
      "phet-simulations",
      "essay-assessment",
      "project-assessment",
      "personalization-engine",
      "predictive-analytics",
    ],
    commercialNeed: "Not part of source-labeled AI work-transition proof packs.",
    recommendedAction: "Separate into their original product projects or retire after owner review.",
    maturity: 2.6,
  },
];

export const functionGovernanceApprovalChecklist = [
  "Confirm no production frontend route calls the legacy slug.",
  "Confirm no Stripe dashboard, cron, webhook, or external integration points to the legacy slug.",
  "Download or preserve the deployed function source before deletion.",
  "Delete one approved slug at a time and immediately rerun supabase functions list.",
  "Redeploy the blocked checkout/webhook source and run live payment proof before claiming billing readiness.",
];
