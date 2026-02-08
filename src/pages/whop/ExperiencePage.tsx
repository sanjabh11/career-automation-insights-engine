/**
 * Whop Experience Page
 * Career Automation Insights Engine
 * 
 * This is the customer-facing entry point when the app is accessed
 * from within a Whop community. It provides the core APO analysis
 * experience without traditional login screens.
 * 
 * CRITICAL: This page must NEVER show login/signup prompts.
 * Users are already authenticated via Whop.
 * 
 * FREEMIUM MODEL: All Whop iframe users get basic access.
 * Premium features can be gated separately, but the app itself
 * must ALWAYS be accessible for Whop reviewers and trial users.
 */

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useWhopApp } from '@/contexts/WhopAppContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Crown, Zap } from 'lucide-react';
import { WhopHeroSection } from '@/components/whop/WhopHeroSection';
import { Button } from '@/components/ui/button';

// Lazy load the main dashboard for performance
const LazyAPODashboard = React.lazy(() => 
  import('@/components/APODashboard').then(m => ({ default: m.APODashboard }))
);

export default function WhopExperiencePage() {
  const { 
    isLoading, 
    isInitialized, 
    whopUser, 
    error, 
    whopTier,
    isFreeTier,
    isPremiumTier,
    requestUpgrade,
    canAccessFeature,
  } = useWhopApp();

  // Show loading while Whop context initializes
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" text="Connecting to Whop..." />
        </motion.div>
      </div>
    );
  }

  // Show error if initialization failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // FREEMIUM MODEL: Never block access for Whop iframe users
  // All users (including reviewers and trial users) get basic access
  // Premium features can be gated individually, but the app loads for everyone

  return (
    <motion.div 
      className="min-h-screen bg-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* User Status Banner - Shows for all users */}
      <div className={`backdrop-blur text-white px-4 py-2 ${isPremiumTier ? 'bg-gradient-to-r from-[var(--accent-primary)]/90 to-[var(--accent-secondary)]/90' : 'bg-gradient-to-r from-slate-700/90 to-slate-600/90'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isPremiumTier ? (
              <>
                <Crown className="h-4 w-4 text-yellow-300" />
                <span>Welcome{whopUser ? `, ${whopUser.username}` : ''}! {whopTier === 'enterprise' ? 'Enterprise' : 'Pro'} Access Active</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 text-emerald-300" />
                <span>Welcome{whopUser ? `, ${whopUser.username}` : ''}! You're using the Free Trial</span>
              </>
            )}
          </div>
          {isFreeTier && (
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={requestUpgrade}
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade to Pro
            </Button>
          )}
          {isPremiumTier && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-emerald-300" />
              <span>{whopTier === 'enterprise' ? 'Enterprise Access' : 'All Features Unlocked'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Community-focused Hero Section */}
      <WhopHeroSection />

      {/* Main APO Dashboard - No login required */}
      <div style={{ background: 'var(--bg-primary)' }}>
        <Suspense fallback={
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="md" text="Loading Career Insights..." />
          </div>
        }>
          <LazyAPODashboard />
        </Suspense>
      </div>
    </motion.div>
  );
}
