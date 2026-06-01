import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EnhancedUserDashboard } from "@/components/EnhancedUserDashboard";
import type { SavedAnalysisItem } from "@/components/SavedAnalysesPanel";
import { UsageDashboard } from "@/components/UsageDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, CheckCircle2, X, Sparkles, FileText, Brain, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analytics, trackEvent } from "@/lib/posthog";

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [showCreditSuccess, setShowCreditSuccess] = useState(false);
  const checkoutStatus = searchParams.get('checkout');
  const checkoutTier = searchParams.get('tier');
  const creditsPurchased = searchParams.get('credits');

  useEffect(() => {
    if (checkoutStatus === 'success') {
      setShowCheckoutSuccess(true);
      analytics.checkoutCompleted(checkoutTier || 'unknown');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      newParams.delete('tier');
      setSearchParams(newParams, { replace: true });
    } else if (checkoutStatus === 'credit_success') {
      setShowCreditSuccess(true);
      trackEvent('credit_purchase_completed', { credits: creditsPurchased });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      newParams.delete('credits');
      setSearchParams(newParams, { replace: true });
    }
  }, [checkoutStatus, checkoutTier, creditsPurchased, searchParams, setSearchParams]);

  const handleLoadAnalysis = (analysis: SavedAnalysisItem) => {
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
        {/* Checkout Success Banner */}
        <AnimatePresence>
          {showCheckoutSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-2 border-emerald-500/40 rounded-xl p-6"
            >
              <button
                onClick={() => setShowCheckoutSuccess(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Welcome to {checkoutTier === 'coach' ? 'Coach Pro' : 'Defender'}!
                  </h2>
                  <p className="text-slate-300 text-sm">Your subscription is active. Here's how to get the most out of it:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/ai-impact-planner')}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors text-left"
                >
                  <Brain className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">Run Your First APO Check</div>
                    <div className="text-xs text-slate-400">Analyze any occupation's automation risk</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/tools/resume-analyzer')}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors text-left"
                >
                  <FileText className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">Analyze Your Resume</div>
                    <div className="text-xs text-slate-400">Find automation-prone phrases</div>
                  </div>
                </button>

                {checkoutTier === 'coach' && (
                  <button
                    onClick={() => navigate('/tools/counselor-reports')}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors text-left"
                  >
                    <Users className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">Generate a Client Report</div>
                      <div className="text-xs text-slate-400">White-labeled PDF in 30 seconds</div>
                    </div>
                  </button>
                )}

                {checkoutTier !== 'coach' && (
                  <button
                    onClick={() => navigate('/tools/skill-adjacency')}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors text-left"
                  >
                    <Sparkles className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">Explore Skill Graph</div>
                      <div className="text-xs text-slate-400">Discover adjacent high-growth skills</div>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credit Purchase Success Banner */}
        <AnimatePresence>
          {showCreditSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-2 border-amber-500/40 rounded-xl p-6"
            >
              <button
                onClick={() => setShowCreditSuccess(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-amber-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {creditsPurchased} Report Credits Added!
                  </h2>
                  <p className="text-slate-300 text-sm">Your credits are ready to use. Generate white-label reports now.</p>
                </div>
                <Button
                  onClick={() => navigate('/tools/counselor-reports')}
                  className="ml-auto bg-amber-500 hover:bg-amber-400 text-black font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
