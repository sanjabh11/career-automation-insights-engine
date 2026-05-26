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
  capturedAt: "2026-05-25",
  activeFunctionCount: 100,
  noJwtFunctionCount: 20,
  blocker:
    "Live deploy attempts for create-credit-checkout plus redeploys of create-checkout-session and stripe-webhook returned Supabase 402 function-count/spend-cap errors.",
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
    nextStep: "After two function slots are freed, redeploy stripe-webhook with credit_purchase handling and keep verify_jwt disabled.",
    maturity: 3.5,
  },
  {
    slug: "calculate-apo",
    liveVerifyJwt: false,
    scope: "public-utility",
    action: "review",
    launchImpact: "Supports public discovery and SEO-style occupation exploration.",
    risk: "Public computation endpoint needs documented rate limits, abuse telemetry, and origin/cost controls.",
    nextStep: "Keep public only if rate-limit evidence and cost ceiling are documented.",
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
    maturity: 3.2,
  },
  {
    slug: "serpapi-jobs",
    liveVerifyJwt: false,
    scope: "external-review",
    action: "harden",
    launchImpact: "Can enrich market signals if API keys and quotas are protected.",
    risk: "Public search proxy can leak quota or trigger provider-cost abuse.",
    nextStep: "Require staff/server-side access or strict throttling before any outreach claim uses live job signals.",
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
    maturity: 2.5,
  },
];

export const legacyFunctionPortfolioGroups: SupabaseFunctionPortfolioGroup[] = [
  {
    group: "Legacy payment slugs",
    slugs: ["stripe-checkout", "stripe-portal"],
    commercialNeed: "No longer needed once create-checkout-session and create-portal-session are confirmed in production.",
    recommendedAction: "Delete after owner approval; this frees two slots needed for checkout/webhook redeploy.",
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

