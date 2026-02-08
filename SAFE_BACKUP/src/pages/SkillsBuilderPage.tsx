import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SoftSkillBuilderPanel from "@/components/SoftSkillBuilderPanel";
import { GraduationCap, Sparkles } from "lucide-react";

export default function SkillsBuilderPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skills Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Self-rate soft skills and set their importance. Use this profile to guide occupation matching and learning paths.
        </p>
      </div>

      <Card className="p-4">
        <SoftSkillBuilderPanel />
      </Card>

      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-700 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-2">Next</h3>
            <p className="text-sm text-purple-800 mb-3">
              Use this profile to explore occupations and learning paths that best fit your strengths and goals.
            </p>
            <Button asChild variant="outline">
              <a href="/?useSkillsProfile=true">Explore Matching Occupations →</a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
