import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: "month" | "year" | "lifetime";
  features: string[];
  whopPlanId: string;
  checkoutUrl: string;
  popular?: boolean;
  tier: "free" | "basic" | "premium" | "enterprise";
}

interface PricingCardProps {
  plan: PricingPlan;
  currentTier?: string;
  onSelect?: (plan: PricingPlan) => void;
  isLoading?: boolean;
}

export function PricingCard({
  plan,
  currentTier,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const isCurrentPlan = currentTier === plan.tier;
  const isFree = plan.tier === "free";

  const handleSelect = () => {
    if (isFree || isCurrentPlan) {
      return;
    }

    if (onSelect) {
      onSelect(plan);
    } else {
      // Open Whop checkout in new window
      window.open(plan.checkoutUrl, "_blank", "noopener,noreferrer");
    }
  };

  const formatPrice = () => {
    if (plan.price === 0) {
      return "Free";
    }

    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: plan.currency,
    }).format(plan.price);

    return (
      <span className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">{formattedPrice}</span>
        <span className="text-muted-foreground text-sm">
          /{plan.billingPeriod === "lifetime" ? "once" : plan.billingPeriod}
        </span>
      </span>
    );
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all hover:shadow-lg",
        plan.popular && "border-primary border-2",
        isCurrentPlan && "bg-primary/5"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <Badge className="bg-primary text-primary-foreground shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-base mt-2">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">{formatPrice()}</div>

        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? "default" : "outline"}
          onClick={handleSelect}
          disabled={isLoading || isCurrentPlan || isFree}
        >
          {isCurrentPlan
            ? "Current Plan"
            : isFree
            ? "Get Started"
            : `Upgrade to ${plan.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
