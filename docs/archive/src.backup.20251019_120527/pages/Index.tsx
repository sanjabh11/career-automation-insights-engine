
import React, { useState } from 'react';
import { EnhancedAPODashboardHeader } from '@/components/EnhancedAPODashboardHeader';
import { useSession } from '@/hooks/useSession';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

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
      <EnhancedAPODashboardHeader 
        userEmail={user?.email}
        onCreditsClick={() => setShowCreditsModal(true)}
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
