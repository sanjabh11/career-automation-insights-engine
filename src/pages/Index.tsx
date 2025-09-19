
import React, { useEffect, useState } from 'react';
import { APODashboard } from '@/components/APODashboard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { EnhancedAPODashboardHeader } from '@/components/EnhancedAPODashboardHeader';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Hero } from '@/components/Hero';

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
      <Hero />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="relative z-10"
      >
        <div className="fixed bottom-6 right-6 z-50">
          <Button asChild size="lg" className="shadow-lg">
            <Link to="/gap-analysis">View Gap Analysis</Link>
          </Button>
        </div>
        <APODashboard />
      </motion.div>
    </motion.div>
  );
};

export default Index;
