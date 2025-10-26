
import React, { useState } from 'react';
import NavigationPremium from '@/components/NavigationPremium';
import { useSession } from '@/hooks/useSession';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { HeroSection } from '@/components/HeroSection';
import { GuidedTour } from '@/components/help/GuidedTour';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const LazyAPODashboard = React.lazy(() => import('@/components/APODashboard').then(m => ({ default: m.APODashboard })));

const Index = () => {
  const { user, loading } = useSession();
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" text="Loading application..." />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <NavigationPremium />
      <OnboardingWizard />
      <HeroSection />
      <GuidedTour
        storageKey="tour:home:v1"
        steps={[
          { title: 'Search occupations', description: 'Use the home search to find your occupation and open the analysis.' },
          { title: 'Review analysis', description: 'See automation risk, evidence, and explanations for your role.' },
          { title: 'Plan next steps', description: 'Open the Career Impact Planner to explore tasks and skills to learn.' },
        ]}
      />
      
      {/* Pure Dashboard Experience - No Hero */}
      <div className="bg-white">
        <React.Suspense fallback={
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" text="Loading dashboard..." />
          </div>
        }>
          <LazyAPODashboard />
        </React.Suspense>
      </div>
    </motion.div>
  );
};

export default Index;
