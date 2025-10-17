
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EnhancedAPODashboardHeader } from '@/components/EnhancedAPODashboardHeader';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Hero } from '@/components/Hero';
import { APODashboard } from '@/components/APODashboard';

const Index = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
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
      {/* Core Dashboard first */}
      <div className="bg-white">
        <APODashboard />
      </div>

      {/* Hero below dashboard (secondary) */}
      <Hero />
    </motion.div>
  );
};

export default Index;
