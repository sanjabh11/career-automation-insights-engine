import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SoftSkillBuilderPanel from "@/components/SoftSkillBuilderPanel";
import { GraduationCap, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function SkillsBuilderPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-[var(--accent-primary)]" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Skills Builder</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Self-rate soft skills and set their importance. Use this profile to guide occupation matching and learning paths.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-4 card-interactive border-[hsl(var(--border))] bg-[var(--bg-secondary)]">
            <SoftSkillBuilderPanel />
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-6 bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 card-interactive sticky top-24">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-[var(--accent-primary)] mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Next Step</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Use this profile to explore occupations and learning paths that best fit your strengths and goals.
                </p>
                <Button asChild variant="outline">
                  <a href="/?useSkillsProfile=true">Explore Matching Occupations →</a>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
