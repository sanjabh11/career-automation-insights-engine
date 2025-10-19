import React, { useState, useEffect, useMemo } from 'react';
import { SearchInterface } from './SearchInterface';
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const APODashboard = () => {
  const [selectedOccupation, setSelectedOccupation] = useState<SelectedOccupation | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<SelectedOccupation[]>([]);
  const [showExport, setShowExport] = useState(false);
  const navigate = useNavigate();

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

  const calculateOverallAPO = (occupation: SelectedOccupation) => {
    if (!occupation) return 0;
    const { tasks, knowledge, skills, abilities, technologies } = occupation.categoryBreakdown;
    return Math.round(
      (tasks.apo + knowledge.apo + skills.apo + abilities.apo + technologies.apo) / 5
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8"
          variants={dashboardVariants}
          initial="hidden"
          animate="visible"
        >
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
              <motion.div className="mb-6 sm:mb-8" variants={cardVariants}>
                <OccupationComparisonPanel
                  occupations={selectedJobs}
                  onRemove={handleRemoveFromSelected}
                />
              </motion.div>
            </ErrorBoundary>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
            <div className="space-y-4 sm:space-y-6">
              <motion.div variants={cardVariants}>
                <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <ErrorBoundary>
                    <SearchInterface onOccupationSelect={handleOccupationSelect} />
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

            <div className="space-y-4 sm:space-y-6">
              <motion.div variants={cardVariants}>
                <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Career Impact Planner</h3>
                      <Button
                        onClick={() => navigate('/ai-impact-planner')}
                        className="gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        Open Planner
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Understand how AI might affect your job, which tasks could be automated or augmented,
                      and what skills to develop to stay relevant in your field.
                    </p>
                  </div>
                </Card>
              </motion.div>

              {selectedOccupation && (
                <ErrorBoundary>
                  <motion.div variants={cardVariants}>
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
          </div>
        </motion.div>

        <ExportCareersModal
          open={showExport}
          onClose={() => setShowExport(false)}
          selectedJobs={selectedJobs}
        />
      </div>
    </ErrorBoundary>
  );
};