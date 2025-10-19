
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
      className="mb-6 flex items-start gap-4 bg-blue-50 border-blue-200 relative"
      role="dialog"
      aria-label="Getting Started Tour"
    >
      <div className="p-2 mt-1 bg-blue-100 rounded-full">
        <Info className="w-5 h-5 text-blue-700" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-blue-900 mb-1">Welcome to the APO Dashboard!</h3>
        <ol className="mb-2 list-decimal ml-4 text-blue-900 text-sm space-y-1">
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
