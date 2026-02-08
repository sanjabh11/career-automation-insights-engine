
import React, { useState } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "apo_onboarding_completed";

export const OnboardingTour = () => {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== "true"
  );

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Card 
      className="mb-6 flex items-start gap-4 bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 relative"
      role="dialog"
      aria-label="Getting Started Tour"
    >
      <div className="p-2 mt-1 bg-[var(--accent-primary)]/20 rounded-full">
        <Info className="w-5 h-5 text-[var(--accent-primary)]" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-[var(--accent-primary)] mb-1">Welcome to the APO Dashboard!</h3>
        <ol className="mb-2 list-decimal ml-4 text-[var(--text-primary)] text-sm space-y-1">
          <li><b>Search for careers</b> and view automation analyses.</li>
          <li><b>Select jobs</b> to compare, export, or bookmark them.</li>
          <li><b>Save progress</b> and access your dashboard anytime.</li>
        </ol>
        <Button size="sm" variant="outline" onClick={handleDismiss} aria-label="Dismiss onboarding tour">
          Got it!
        </Button>
      </div>
    </Card>
  );
};
