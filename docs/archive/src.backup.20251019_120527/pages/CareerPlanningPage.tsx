
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { CareerPlanningDashboard } from '@/components/CareerPlanningDashboard';
import { motion } from 'framer-motion';

export default function CareerPlanningPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Header */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 w-full sm:w-auto"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to APO Dashboard
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Main Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      <CareerPlanningDashboard />
    </motion.div>
  );
}
