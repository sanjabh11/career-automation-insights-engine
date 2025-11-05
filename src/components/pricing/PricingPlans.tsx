import React from "react";
import { PricingCard, PricingPlan } from "./PricingCard";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Default pricing plans - customize these based on your Whop products
export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for exploring career automation insights",
    price: 0,
    currency: "USD",
    billingPeriod: "month",
    tier: "free",
    whopPlanId: "",
    checkoutUrl: "",
    features: [
      "Basic career analysis",
      "Limited occupation searches",
      "Access to public data",
      "Community support",
      "Basic automation risk scores",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "For professionals tracking their career path",
    price: 9.99,
    currency: "USD",
    billingPeriod: "month",
    tier: "basic",
    whopPlanId: "plan_xxxxx", // Replace with your Whop plan ID
    checkoutUrl: `https://whop.com/checkout/plan_xxxxx?d=${
      import.meta.env.VITE_WHOP_COMPANY_ID || ""
    }`,
    features: [
      "Everything in Free",
      "Unlimited occupation searches",
      "Advanced analytics",
      "Skill gap analysis",
      "Learning path recommendations",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "For career changers and professionals",
    price: 29.99,
    currency: "USD",
    billingPeriod: "month",
    tier: "premium",
    whopPlanId: "plan_yyyyy", // Replace with your Whop plan ID
    checkoutUrl: `https://whop.com/checkout/plan_yyyyy?d=${
      import.meta.env.VITE_WHOP_COMPANY_ID || ""
    }`,
    popular: true,
    features: [
      "Everything in Basic",
      "AI career coaching",
      "Personalized skill recommendations",
      "Career trajectory simulation",
      "Priority support",
      "Export and share analyses",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations and teams",
    price: 99.99,
    currency: "USD",
    billingPeriod: "month",
    tier: "enterprise",
    whopPlanId: "plan_zzzzz", // Replace with your Whop plan ID
    checkoutUrl: `https://whop.com/checkout/plan_zzzzz?d=${
      import.meta.env.VITE_WHOP_COMPANY_ID || ""
    }`,
    features: [
      "Everything in Premium",
      "Team collaboration tools",
      "Custom integrations",
      "Dedicated account manager",
      "Advanced API access",
      "Custom reports",
      "SSO & advanced security",
      "White-label options",
    ],
  },
];

interface PricingPlansProps {
  plans?: PricingPlan[];
  currentTier?: string;
  onSelectPlan?: (plan: PricingPlan) => void;
  showFree?: boolean;
}

export function PricingPlans({
  plans = DEFAULT_PRICING_PLANS,
  currentTier = "free",
  onSelectPlan,
  showFree = true,
}: PricingPlansProps) {
  const displayPlans = showFree ? plans : plans.filter((p) => p.tier !== "free");

  // Check if Whop is configured
  const whopCompanyId = import.meta.env.VITE_WHOP_COMPANY_ID;
  const isWhopConfigured = whopCompanyId && whopCompanyId !== "your_whop_company_id_here";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get insights into career automation risks and opportunities. Upgrade anytime to unlock more features.
        </p>
      </div>

      {/* Configuration warning */}
      {!isWhopConfigured && (
        <Alert className="mb-8 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Whop integration is not fully configured. Please set up your Whop Company ID and Plan IDs in the environment variables and update the pricing configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {displayPlans.map((plan) => (
          <div key={plan.id} className={plan.popular ? "md:scale-105" : ""}>
            <PricingCard
              plan={plan}
              currentTier={currentTier}
              onSelect={onSelectPlan}
            />
          </div>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Need help choosing? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
