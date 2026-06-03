import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Lightbulb, ArrowRight, X, Target, Shield, Zap } from "lucide-react";

export function OnboardingWizard() {
  const [open, setOpen] = React.useState(() => {
    try {
      return localStorage.getItem("wizard:status") !== "done";
    } catch { return true; }
  });
  const [step, setStep] = React.useState<number>(() => {
    try {
      const s = Number(localStorage.getItem("wizard:step") || "0");
      return Number.isFinite(s) ? Math.max(0, Math.min(2, s)) : 0;
    } catch { return 0; }
  });

  const [jobTitle, setJobTitle] = React.useState("");

  // Simplified 3-step onboarding as per UI plan
  const steps = [
    { 
      title: "Enter Your Occupation", 
      key: "search",
      icon: Search,
      description: "Search for your job title to get started"
    },
    { 
      title: "View Automation Risk", 
      key: "risk",
      icon: TrendingUp,
      description: "See which tasks may be automated or augmented"
    },
    { 
      title: "Get Your Pathway", 
      key: "pathway",
      icon: Lightbulb,
      description: "Discover skills to learn with ROI estimates"
    }
  ];

  React.useEffect(() => {
    try {
      localStorage.setItem("wizard:step", String(step));
    } catch {}
  }, [step]);

  if (!open) return null;

  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  const finish = () => {
    try {
      localStorage.setItem("wizard:status", "done");
      if (jobTitle.trim()) {
        localStorage.setItem("planner:lastSearch", jobTitle.trim());
      }
    } catch {}
    setOpen(false);
  };

  const skip = () => {
    try {
      localStorage.setItem("wizard:status", "done");
    } catch {}
    setOpen(false);
  };

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" 
        onClick={skip} 
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-slate-900/95 backdrop-blur-xl border-[var(--accent-primary)]/20 shadow-2xl shadow-[var(--accent-primary)]/10 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Welcome to Automation Insights</h2>
                    <p className="text-sm text-white/80">3 simple steps to get started</p>
                  </div>
                </div>
                <button 
                  onClick={skip}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-white/70 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Progress indicators */}
            <div className="px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between gap-2">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex-1 flex items-center">
                    <div className={`flex items-center gap-2 ${i <= step ? 'text-[var(--accent-primary)]' : 'text-slate-500'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        i < step ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 
                        i === step ? 'bg-[var(--accent-primary)]/20 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]' : 
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <span className="hidden sm:block text-xs font-medium">{s.title}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-[var(--accent-primary)]' : 'bg-slate-700'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="p-6">
              <AnimatePresence mode="wait" custom={step}>
                <motion.div
                  key={step}
                  custom={step}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 0 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex p-4 bg-[var(--accent-primary)]/10 rounded-2xl mb-4">
                          <Search className="h-10 w-10 text-[var(--accent-primary)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Enter Your Occupation</h3>
                        <p className="text-slate-400">Start by searching for your current job title or the role you're interested in</p>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                          placeholder="e.g., Software Developer, Nurse, Marketing Manager"
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          className="pl-12 h-14 text-base bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        {['Software Developer', 'Registered Nurse', 'Data Analyst', 'Project Manager'].map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => setJobTitle(suggestion)}
                            className="px-3 py-1.5 text-sm bg-slate-800/60 border border-slate-600/50 text-slate-300 rounded-lg hover:bg-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)]/50 hover:text-white transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-4">
                          <TrendingUp className="h-10 w-10 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">View Automation Risk</h3>
                        <p className="text-slate-400">See task-level analysis of what may be automated or augmented by AI</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                          <div className="text-3xl font-bold text-gradient-cosmic mb-1">65%</div>
                          <div className="text-xs text-slate-400">APO Score</div>
                          <div className="text-xs text-amber-400 mt-1">Medium Risk</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                          <div className="text-3xl font-bold text-emerald-400 mb-1">12</div>
                          <div className="text-xs text-slate-400">Tasks Analyzed</div>
                          <div className="text-xs text-slate-500 mt-1">Per occupation</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                          <div className="text-3xl font-bold text-[var(--accent-primary)] mb-1">5</div>
                          <div className="text-xs text-slate-400">Skill Categories</div>
                          <div className="text-xs text-slate-500 mt-1">Comprehensive view</div>
                        </div>
                      </div>

                      <div className="p-4 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/20">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-[var(--accent-primary)] mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-white">Evidence-Based Analysis</div>
                            <div className="text-xs text-slate-400 mt-1">Current estimates use O*NET data and published exposure research; calibration artifacts are in progress.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl mb-4">
                          <Lightbulb className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Get Your Pathway</h3>
                        <p className="text-slate-400">Discover skills to learn with ROI estimates and payback timelines</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { skill: 'Python Programming', roi: '6 months', impact: 'High', color: 'emerald' },
                          { skill: 'Data Analytics', roi: '8 months', impact: 'High', color: 'blue' },
                          { skill: 'AI/ML Fundamentals', roi: '12 months', impact: 'Medium', color: 'teal' },
                        ].map((item, i) => (
                          <div key={item.skill} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center`}>
                                <Target className={`h-4 w-4 text-${item.color}-400`} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{item.skill}</div>
                                <div className="text-xs text-slate-400">Payback: ~{item.roi}</div>
                              </div>
                            </div>
                            <Badge className={`bg-${item.color}-500/20 text-${item.color}-400 border-${item.color}-500/30`}>
                              {item.impact} Impact
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-amber)]/10 rounded-xl border border-[var(--accent-primary)]/20">
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 text-amber-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-white">Ready to explore?</div>
                            <div className="text-xs text-slate-400 mt-1">Click "Get Started" to analyze {jobTitle || 'your occupation'} and get personalized recommendations</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
                <Button 
                  variant="ghost" 
                  onClick={step === 0 ? skip : back}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  {step === 0 ? 'Skip' : 'Back'}
                </Button>
                
                <div className="flex items-center gap-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[var(--accent-primary)]' : 'bg-slate-600'}`}
                    />
                  ))}
                </div>

                <Button 
                  onClick={step === steps.length - 1 ? finish : next}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)] px-6 rounded-xl shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 transition-all"
                >
                  {step === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
