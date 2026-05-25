export type LaunchGatePriority = "high" | "medium";
export type LaunchGateOwner = "owner-secret" | "codex-implemented" | "staff-review" | "provider-integration";

export interface CommercialLaunchGateItem {
  gap: string;
  control: string;
  currentProof: string;
  remainingAction: string;
  priority: LaunchGatePriority;
  owner: LaunchGateOwner;
  maturity: number;
}

export interface FunctionSecurityReviewGroup {
  group: string;
  functions: string[];
  currentControl: string;
  remainingRisk: string;
  maturity: number;
}

export const commercialLaunchGateItems: CommercialLaunchGateItem[] = [
  {
    gap: "Auth live E2E secrets",
    control: "Closeout workflow validates live test-user secrets before authenticated artifact tests run.",
    currentProof: ".github/workflows/supabase-commercial-live-closeout.yml and verify-commercial-live-auth-e2e.mjs are wired.",
    remainingAction: "Owner must add LIVE_SUPABASE_TEST_USER_EMAIL and LIVE_SUPABASE_TEST_USER_PASSWORD as GitHub secrets.",
    priority: "high",
    owner: "owner-secret",
    maturity: 3.6,
  },
  {
    gap: "Exposed token rotation",
    control: "Tracked source secret hygiene is enforced; rotation remains an owner action because tokens are external credentials.",
    currentProof: "npm run verify:secrets scans tracked files and the runbook keeps secret values out of repo artifacts.",
    remainingAction: "Rotate the pasted Supabase PAT and any service-role/Stripe/O*NET/SerpAPI keys that may have been exposed in chat or shell history.",
    priority: "high",
    owner: "owner-secret",
    maturity: 3.2,
  },
  {
    gap: "Public/no-JWT function review",
    control: "Payment checkout functions now require Supabase JWTs; public utility APIs remain documented as planning surfaces.",
    currentProof: "create-checkout-session and create-portal-session are live with JWT verification; legacy stripe-checkout/stripe-portal remain public and should be retired after function-cap cleanup.",
    remainingAction: "Review live no-JWT utility functions for origin allowlists, rate limits, and abuse telemetry before paid launch; remove legacy public payment slugs after approval.",
    priority: "high",
    owner: "staff-review",
    maturity: 3.5,
  },
  {
    gap: "Legacy function sprawl",
    control: "Commercial launch gate separates core proof-pack functions from unrelated legacy deployed functions.",
    currentProof: "Live function inventory shows many active non-commercial functions; launch positioning no longer claims every function as product scope.",
    remainingAction: "Move unrelated legacy functions to a separate project or decommission them after owner review.",
    priority: "high",
    owner: "staff-review",
    maturity: 2.6,
  },
  {
    gap: "Outreach automation",
    control: "Lead ops now has staff-only outreach stage, channel, priority, sequence, follow-up, and next-action metadata.",
    currentProof: "update_commercial_lead_outreach_plan RPC plus Commercial Lead Operations UI and CSV export.",
    remainingAction: "Add email provider/webhook automation and unsubscribe handling after manual founder-led pilot validation.",
    priority: "medium",
    owner: "codex-implemented",
    maturity: 4.0,
  },
  {
    gap: "Licensed labor-market data",
    control: "Open-source and public data remain caveated; licensed provider adapters are explicit future boundaries.",
    currentProof: "Source manifest includes public BLS/O*NET/CareerOneStop plus licensed-provider caveats.",
    remainingAction: "Add credentialed Lightcast/ESCO adapter only after a data agreement and buyer geography are selected.",
    priority: "medium",
    owner: "provider-integration",
    maturity: 3.3,
  },
  {
    gap: "Accessibility proof",
    control: "Automated commercial a11y smoke writes WCAG 2.2 audit artifacts without claiming full conformance.",
    currentProof: "verify-commercial-accessibility.mjs and commercial-accessibility-audit-latest.md/json.",
    remainingAction: "Complete manual WCAG-EM, keyboard, screen-reader, text-spacing, target-size, and form-error evidence.",
    priority: "medium",
    owner: "staff-review",
    maturity: 4.0,
  },
  {
    gap: "Payment fulfillment",
    control: "Stripe checkout now requires authenticated users; credit-purchase webhook path grants report credits and records transactions.",
    currentProof: "Source is ready: stripe.ts sends Authorization, create-checkout-session verifies caller JWTs for subscription and credit checkout, and stripe-webhook handles credit_purchase metadata. Live create-checkout-session/portal are deployed, but the latest credit/webhook redeploy is blocked by Supabase function-count cap.",
    remainingAction: "Free function slots or raise the Supabase cap, redeploy create-checkout-session plus stripe-webhook, then run Stripe test-mode webhook replay and confirm report-credit balance changes in a live test account.",
    priority: "medium",
    owner: "staff-review",
    maturity: 3.4,
  },
];

export const functionSecurityReviewGroups: FunctionSecurityReviewGroup[] = [
  {
    group: "Commercial core with JWT",
    functions: ["parse-resume", "analyze-resume", "generate-counselor-report", "calculate-skill-adjacency", "find-bridge-roles"],
    currentControl: "Authenticated proof-pack and resume flows are deployed with JWT verification.",
    remainingRisk: "Run authenticated live E2E after GitHub test-user secrets are added.",
    maturity: 4.2,
  },
  {
    group: "Public utility APIs",
    functions: ["search-occupations", "calculate-apo", "analyze-occupation-tasks", "skill-recommendations", "ai-career-coach"],
    currentControl: "Useful for public discovery and SEO experiences; several include schema validation, CORS, or rate-limit code.",
    remainingRisk: "Document intentional public status, rate-limit settings, and abuse monitoring per deployed function.",
    maturity: 3.2,
  },
  {
    group: "Payment and subscription functions",
    functions: ["create-checkout-session", "create-portal-session", "stripe-webhook"],
    currentControl: "New checkout and portal paths require authenticated callers; webhook source verifies Stripe signature and handles credit purchases. Credit checkout is intentionally folded into create-checkout-session to avoid adding another live function.",
    remainingRisk: "Supabase function-count cap currently blocks redeploying the latest checkout/webhook source; retire legacy payment slugs or raise the cap before production billing launch.",
    maturity: 3.4,
  },
  {
    group: "Legacy/non-commercial deployed functions",
    functions: ["legal-*", "energy-*", "streaming-*", "education-*", "mental-health-*"],
    currentControl: "Excluded from commercial proof-pack positioning and treated as deployment sprawl.",
    remainingRisk: "Owner review required before delete, archive, or separate-project migration.",
    maturity: 2.4,
  },
];
