import React from 'react';
import { AIImpactDashboard } from '@/components/AIImpactDashboard';
import { SearchHistoryPanel } from '@/components/SearchHistoryPanel';
import { EnhancedAPODashboardHeader } from '@/components/EnhancedAPODashboardHeader';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIImpactPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <EnhancedAPODashboardHeader userEmail={user?.email} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold ml-4">AI Impact Career Planner</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AIImpactDashboard />
          </div>
          <div className="lg:col-span-1">
            <SearchHistoryPanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}