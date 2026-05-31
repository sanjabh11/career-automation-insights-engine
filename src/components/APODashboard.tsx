
import React, { useState, useEffect, useMemo } from 'react';
import { SearchInterface } from './SearchInterface';
import SearchInterfacePremium from './SearchInterfacePremium';
import { OccupationAnalysis } from './OccupationAnalysis';
import { TopCareersPanel } from './TopCareersPanel';
import { StatsOverview } from './StatsOverview';
import { OccupationComparisonPanel } from './OccupationComparisonPanel';
import { Card } from '@/components/ui/card';
import { SavedSelectionsPanel } from "./SavedSelectionsPanel";
import { useSavedSelections } from "@/hooks/useSavedSelections";
import { JobMarketPanel } from './JobMarketPanel';
import { ExportCareersModal } from "./ExportCareersModal";
import { SelectedCareersPanel } from "./SelectedCareersPanel";
import { OnboardingTour } from "./OnboardingTour";
import { ErrorBoundary } from "./ErrorBoundary";
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { GuidedTour } from '@/components/help/GuidedTour';
import { RightSidebar } from './RightSidebar';
import { MobileSidebarTrigger } from './MobileSidebarTrigger';
import { ExecutiveSummary } from './ExecutiveSummary';

export interface SelectedOccupation {
  code: string;
  title: string;
  description: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  tasks: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  knowledge: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  skills: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  abilities: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  technologies: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  categoryBreakdown: {
    tasks: { apo: number; confidence: string };
    knowledge: { apo: number; confidence: string };
    skills: { apo: number; confidence: string };
    abilities: { apo: number; confidence: string };
    technologies: { apo: number; confidence: string };
  };
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
  metadata: {
    analysis_version: string;
    calculation_method: string;
    timestamp: string;
  };
}

const dashboardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const APODashboard = () => {
  const [selectedOccupation, setSelectedOccupation] = useState<SelectedOccupation | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<SelectedOccupation[]>([]);
  const [showExport, setShowExport] = useState(false);
  const navigate = useNavigate();

  // S2-8: Predictive CTA — highlight planner button when user has searched but never visited planner
  const hasVisitedPlanner = useMemo(() => {
    try { return localStorage.getItem('planner:visited') === '1'; } catch { return true; }
  }, []);
  const shouldHighlightPlanner = selectedOccupation != null && !hasVisitedPlanner;

  const savedSelections = useSavedSelections<SelectedOccupation[]>();

  const handleOccupationSelect = (occupation: any) => {
    console.log('Selected occupation with enhanced APO data:', occupation);
    setSelectedOccupation(occupation);
  };

  const handleAddToSelected = () => {
    if (selectedOccupation && !selectedJobs.some(job => job.code === selectedOccupation.code)) {
      const updatedJobs = [...selectedJobs, selectedOccupation];
      setSelectedJobs(updatedJobs);
      savedSelections.saveList('My Selections', updatedJobs);
    }
  };

  const handleRemoveFromSelected = (jobCode: string) => {
    const updatedJobs = selectedJobs.filter(job => job.code !== jobCode);
    setSelectedJobs(updatedJobs);
    savedSelections.saveList('My Selections', updatedJobs);
  };

  const handleRemoveSelected = (code: string) => handleRemoveFromSelected(code);

  const handleExport = () => setShowExport(true);
  const handleExportClose = () => setShowExport(false);

  const calculateOverallAPO = (occupation: SelectedOccupation | null | undefined) => {
    // Prefer the pre-computed overallAPO from the backend (authoritative)
    if (occupation?.overallAPO != null && occupation.overallAPO > 0) {
      return Math.round(occupation.overallAPO);
    }

    if (!occupation || !occupation.categoryBreakdown) return 0;

    const { tasks, knowledge, skills, abilities, technologies } = occupation.categoryBreakdown;

    // Weighted formula matching backend DEFAULT_CATEGORY_WEIGHTS
    const categoryWeights: Array<[{ apo: number } | undefined, number]> = [
      [tasks, 0.35],
      [technologies, 0.25],
      [skills, 0.20],
      [abilities, 0.15],
      [knowledge, 0.05],
    ];

    let weightedSum = 0;
    let totalWeight = 0;
    for (const [cat, w] of categoryWeights) {
      if (cat && typeof cat.apo === 'number') {
        weightedSum += cat.apo * w;
        totalWeight += w;
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          className="w-full py-4 sm:py-6 lg:py-8"
          variants={dashboardVariants}
          initial="hidden"
          animate="visible"
        >
          <GuidedTour
            storageKey="tour:dashboard:v1"
            steps={[
              { title: 'Search & analyze', description: 'Use the search panel to pick an occupation and see automation analysis.' },
              { title: 'Save & compare', description: 'Add occupations to your list and compare side-by-side.' },
              { title: 'Plan next steps', description: 'Open the Career Impact Planner to explore skills and learning paths.' },
            ]}
          />
          <div className="mb-4">
            <OnboardingTour />
          </div>

          <ErrorBoundary>
            <motion.div variants={cardVariants}>
              <StatsOverview selectedJobsCount={selectedJobs.length} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div variants={cardVariants}>
              <SavedSelectionsPanel
                selections={selectedJobs}
                onLoad={(loadedSelections: SelectedOccupation[]) => {
                  if (loadedSelections && loadedSelections.length > 0) {
                    setSelectedJobs(loadedSelections);
                  }
                }}
              />
            </motion.div>
          </ErrorBoundary>

          {selectedJobs.length > 1 && (
            <ErrorBoundary>
              <motion.div className="mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto" variants={cardVariants}>
                <OccupationComparisonPanel
                  occupations={selectedJobs}
                  onRemove={handleRemoveFromSelected}
                />
              </motion.div>
            </ErrorBoundary>
          )}

          <div className="main-layout">
            {/* Left Column - Search & Top Careers */}
            <div className="space-y-4 sm:space-y-6">
              <motion.div variants={cardVariants}>
                <Card className="p-4 sm:p-6 rounded-2xl border border-[hsl(var(--border))] bg-[var(--bg-secondary)] shadow-lg card-interactive">
                  <ErrorBoundary>
                    <SearchInterfacePremium onOccupationSelect={handleOccupationSelect} />
                  </ErrorBoundary>
                </Card>
              </motion.div>

              {selectedJobs.length > 0 && (
                <ErrorBoundary>
                  <motion.div variants={cardVariants}>
                    <SelectedCareersPanel
                      selectedJobs={selectedJobs}
                      calculateOverallAPO={calculateOverallAPO}
                      handleRemoveSelected={handleRemoveSelected}
                    />
                  </motion.div>
                </ErrorBoundary>
              )}

              <ErrorBoundary>
                <motion.div variants={cardVariants}>
                  <TopCareersPanel />
                </motion.div>
              </ErrorBoundary>
            </div>

            {/* Main Column - Career Impact Planner & Analysis */}
            <div className="space-y-4 sm:space-y-6 min-w-0">
              <motion.div variants={cardVariants}>
                <Card className="p-4 sm:p-6 rounded-2xl border border-[hsl(var(--border))] bg-[var(--bg-secondary)] shadow-lg card-interactive">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Career Impact Planner</h3>
                      <Button
                        onClick={() => {
                          try { localStorage.setItem('planner:visited', '1'); } catch {
                            // localStorage may be unavailable in private or restricted browser contexts.
                          }
                          navigate('/ai-impact-planner');
                        }}
                        className={`gap-2 ${shouldHighlightPlanner ? 'animate-pulse ring-2 ring-[var(--accent-primary)]/50 shadow-lg shadow-[var(--accent-primary)]/20' : ''}`}
                      >
                        <Bot className="w-4 h-4" />
                        Open Planner
                      </Button>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Understand how AI might affect your job, which tasks could be automated or augmented,
                      and what skills to develop to stay relevant in your field.
                    </p>
                  </div>
                </Card>
              </motion.div>

              {selectedOccupation && (
                <ErrorBoundary>
                  <motion.div variants={cardVariants}>
                    <ExecutiveSummary
                      occupationTitle={selectedOccupation.title}
                      automationPercentage={calculateOverallAPO(selectedOccupation)}
                      riskLevel={
                        calculateOverallAPO(selectedOccupation) >= 67 ? 'high' :
                          calculateOverallAPO(selectedOccupation) >= 34 ? 'medium' : 'low'
                      }
                      onViewDetails={() => {
                        document.getElementById('detailed-analysis')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </motion.div>

                  <motion.div variants={cardVariants} id="detailed-analysis" className="mt-6">
                    <OccupationAnalysis
                      occupation={selectedOccupation}
                      overallAPO={calculateOverallAPO(selectedOccupation)}
                      onAddToSelected={handleAddToSelected}
                      isAlreadySelected={selectedJobs.some(job => job.code === selectedOccupation.code)}
                    />
                  </motion.div>
                </ErrorBoundary>
              )}

              {selectedOccupation && (
                <ErrorBoundary>
                  <motion.div variants={cardVariants}>
                    <JobMarketPanel jobTitle={selectedOccupation.title} />
                  </motion.div>
                </ErrorBoundary>
              )}
            </div>

            {/* Right Sidebar - Contextual Actions & Insights */}
            <div className="hidden xl:block space-y-6">
              <RightSidebar
                selectedOccupation={selectedOccupation}
                onAddToList={handleAddToSelected}
                isAlreadySelected={selectedJobs.some(job => selectedOccupation && job.code === selectedOccupation.code)}
              />
            </div>
          </div>

          {/* Mobile Sidebar Trigger (FAB) */}
          <MobileSidebarTrigger
            selectedOccupation={selectedOccupation}
            onAddToList={handleAddToSelected}
            isAlreadySelected={selectedJobs.some(job => selectedOccupation && job.code === selectedOccupation.code)}
          />
        </motion.div>

        <ExportCareersModal
          open={showExport}
          onClose={() => setShowExport(false)}
          selectedJobs={selectedJobs}
        />
      </div >
    </ErrorBoundary >
  );
};
