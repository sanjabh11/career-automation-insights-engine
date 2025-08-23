import React, { useState } from 'react';
import { SearchInterface } from './SearchInterface';
import { OccupationAnalysis } from './OccupationAnalysis';
import { TopCareersPanel } from './TopCareersPanel';
import { StatsOverview } from './StatsOverview';
import { OccupationComparisonPanel } from './OccupationComparisonPanel';
import { Card } from '@/components/ui/card';
import { SavedSelectionsPanel } from "./SavedSelectionsPanel";
import { useSavedSelections } from "@/hooks/useSavedSelections";
import { JobMarketPanel } from './JobMarketPanel';
import { APODashboardHeader } from "./APODashboardHeader";
import { ExportCareersModal } from "./ExportCareersModal";
import { SelectedCareersPanel } from "./SelectedCareersPanel";
import { OnboardingTour } from "./OnboardingTour";
import { ErrorBoundary } from "./ErrorBoundary";
import { motion } from 'framer-motion';

// Default sectionVariants for fade-in animation
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
import { Button } from './ui/button';
import { Notebook as Robot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      setSelectedJobs([...selectedJobs, selectedOccupation]);
      savedSelections.saveSelection(selectedOccupation);
    }
  };

  const handleRemoveFromSelected = (jobCode: string) => {
    setSelectedJobs(selectedJobs.filter(job => job.code !== jobCode));
    savedSelections.removeSelection(jobCode);
  };

  const handleExport = () => {
    setShowExport(true);
  };

  const handleExportClose = () => {
    setShowExport(false);
  };

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 sm:pt-6 lg:pt-8">
          <OnboardingTour />
        </div>
        
        <APODashboardHeader
          selectedJobsCount={selectedJobs.length}
          onExport={() => setShowExport(true)}
        />

        <motion.div 
          className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8"
        >
          <ErrorBoundary>
            <motion.div>
              <StatsOverview selectedJobsCount={selectedJobs.length} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div>
              <SavedSelectionsPanel
                selections={selectedJobs}
                onLoad={savedSelections.loadSelections}
              />
            </motion.div>
          </ErrorBoundary>

          {selectedJobs.length > 1 && (
            <ErrorBoundary>
              <motion.div 
                className="mb-6 sm:mb-8"
              >
                <OccupationComparisonPanel
                  occupations={selectedJobs}
                  onRemove={handleRemoveFromSelected}
                  onRemove={handleRemoveSelected}
                />
              </motion.div>
            </ErrorBoundary>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
  {/* Career Search always first */}
  <div className="space-y-4 sm:space-y-6">
    <motion.div variants={sectionVariants}>
      <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <ErrorBoundary>
          <SearchInterface onOccupationSelect={handleOccupationSelect} />
        </ErrorBoundary>
      </Card>
    </motion.div>

    {/* Saved Selections always after Career Search */}
    {selectedJobs.length > 0 && (
      <ErrorBoundary>
        <motion.div 
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <SelectedCareersPanel
            selectedJobs={selectedJobs}
            calculateOverallAPO={calculateOverallAPO}
            handleRemoveSelected={handleRemoveSelected}
          />
        </motion.div>
      </ErrorBoundary>
    )}

    {/* Career APO Explorer always after Saved Selections */}
    <ErrorBoundary>
      <motion.div variants={sectionVariants}>
        <TopCareersPanel />
      </motion.div>
    </ErrorBoundary>
  </div>

  {/* Right column: Planner, Occupation Analysis, Job Market Panel */}
  <div className="space-y-4 sm:space-y-6">
    {/* AI Impact Career Planner always visible */}
    <motion.div variants={sectionVariants}>
      <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Impact Career Planner</h3>
            <Button 
              onClick={() => navigate('/ai-impact')}
              className="gap-2"
            >
              <Robot className="w-4 h-4" />
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

    {/* Occupation Analysis (if selected) */}
    {selectedOccupation && (
      <motion.div 
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <ErrorBoundary>
          <OccupationAnalysis
            occupation={selectedOccupation}
            overallAPO={calculateOverallAPO(selectedOccupation)}
            onAddToSelected={handleAddToSelected}
            isAlreadySelected={selectedJobs.some(job => job.code === selectedOccupation.code)}
          />
        </ErrorBoundary>
      </motion.div>
    )}

    {/* Job Market Panel (if occupation selected) */}
    {selectedOccupation && (
      <ErrorBoundary>
        <motion.div 
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
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