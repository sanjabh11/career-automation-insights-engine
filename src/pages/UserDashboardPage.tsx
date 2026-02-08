import React from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedUserDashboard } from "@/components/EnhancedUserDashboard";
import { UsageDashboard } from "@/components/UsageDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function UserDashboardPage() {
  const navigate = useNavigate();

  const handleLoadAnalysis = (analysis: any) => {
    localStorage.setItem('loadedAnalysis', JSON.stringify(analysis));
    navigate('/');
  };

  const handleSearchSelect = (searchTerm: string) => {
    localStorage.setItem('selectedSearch', searchTerm);
    navigate('/');
  };

  return (
    <motion.div
      className="min-h-screen" style={{ background: 'var(--bg-primary)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Header */}
      <motion.div
        className="bg-[var(--bg-secondary)]/80 backdrop-blur-sm border-b border-[hsl(var(--border))] sticky top-0 z-40"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/30 transition-all duration-200 w-full sm:w-auto"
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
                className="text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 w-full sm:w-auto"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Main Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        {/* Usage Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <UsageDashboard />
        </motion.div>

        {/* Enhanced User Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <EnhancedUserDashboard
            onLoadAnalysis={handleLoadAnalysis}
            onSearchSelect={handleSearchSelect}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
