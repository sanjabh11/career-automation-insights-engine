/**
 * Whop Dashboard Page (Seller View)
 * Career Automation Insights Engine
 * 
 * This is the seller/admin dashboard entry point for Whop community owners.
 * It shows community analytics, member management, and app configuration.
 * 
 * FREEMIUM MODEL: Shows preview/demo mode for non-admins so Whop reviewers
 * can see the dashboard functionality without being blocked.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useWhopApp } from '@/contexts/WhopAppContext';
import { CommunityDashboard } from '@/components/whop/CommunityDashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Settings, Eye, Crown } from 'lucide-react';

export default function WhopDashboardPage() {
  const { isLoading, isInitialized, whopUser, isAdmin, error } = useWhopApp();

  // Show loading while Whop context initializes
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" text="Loading Dashboard..." />
        </motion.div>
      </div>
    );
  }

  // Show error if initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // For non-admins, show preview mode (allows Whop reviewers to test)
  const isPreviewMode = !isAdmin;

  return (
    <motion.div 
      className="min-h-screen" style={{ background: 'var(--bg-primary)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Preview Mode — This is how your community dashboard will look</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="h-4 w-4" />
              <span>Full access when you install the app</span>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary)] rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Community Dashboard</h1>
              <p className="text-sm text-slate-400">
                {isPreviewMode ? 'Preview of your Career Insights dashboard' : 'Manage your Career Insights community'}
              </p>
            </div>
          </div>
          {whopUser ? (
            <div className="text-sm text-slate-400">
              Logged in as {whopUser.username}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              Demo Data Shown
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <CommunityDashboard />
      </div>
    </motion.div>
  );
}
