import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhopMembershipBadgeProps {
  tier: "free" | "basic" | "premium" | "enterprise";
  status?: "active" | "past_due" | "canceled" | "trialing";
  className?: string;
  showIcon?: boolean;
}

const TIER_CONFIG = {
  free: {
    label: "Free",
    icon: Shield,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  basic: {
    label: "Basic",
    icon: Zap,
    variant: "default" as const,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  premium: {
    label: "Premium",
    icon: Star,
    variant: "default" as const,
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    variant: "default" as const,
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
};

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800",
  },
  trialing: {
    label: "Trial",
    className: "bg-blue-100 text-blue-800",
  },
  past_due: {
    label: "Past Due",
    className: "bg-orange-100 text-orange-800",
  },
  canceled: {
    label: "Canceled",
    className: "bg-red-100 text-red-800",
  },
};

export function WhopMembershipBadge({
  tier,
  status = "active",
  className,
  showIcon = true,
}: WhopMembershipBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge className={cn("flex items-center gap-1", config.className)}>
        {showIcon && <Icon className="w-3 h-3" />}
        <span>{config.label}</span>
      </Badge>

      {status && status !== "active" && (
        <Badge
          variant="outline"
          className={cn("text-xs", STATUS_CONFIG[status]?.className)}
        >
          {STATUS_CONFIG[status]?.label}
        </Badge>
      )}
    </div>
  );
}

export default WhopMembershipBadge;
