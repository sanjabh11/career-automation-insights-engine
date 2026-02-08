
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfilePanel } from "./UserProfilePanel";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { SavedAnalysesPanel } from "./SavedAnalysesPanel";
import { SearchHistoryPanel } from "./SearchHistoryPanel";
import { SystemAdminPanel } from "./SystemAdminPanel";
import { UsageDashboard } from "./UsageDashboard";
import { ProgressWidget } from "@/components/ProgressWidget";
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  BookOpen,
  History,
  Activity,
  Lightbulb,
  TrendingUp,
  Clock,
  Target,
  BarChart3
} from "lucide-react";

interface EnhancedUserDashboardProps {
  onLoadAnalysis?: (analysis: any) => void;
  onSearchSelect?: (searchTerm: string) => void;
}

function WelcomeBanner() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white border-0 mb-6 shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{greeting} — ready to level up?</h2>
              <p className="text-white/80">
                Analyze career automation potential with AI-powered insights
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickStatsCard({ title, value, icon: Icon, trend, color, index }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="card-interactive rounded-2xl border-[hsl(var(--border))] bg-[var(--bg-secondary)]">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
              {trend && (
                <p className="text-xs text-[var(--accent-success)] mt-1">{trend}</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActions({ onSearchSelect }: { onSearchSelect?: (searchTerm: string) => void }) {
  const actions = [
    {
      title: "Popular Searches",
      items: [
        "Software Developer",
        "Data Scientist",
        "Project Manager",
        "Marketing Specialist"
      ]
    }
  ];

  return (
    <Card className="rounded-2xl border-[hsl(var(--border))] bg-[var(--bg-secondary)] card-interactive">
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
          <Target className="w-5 h-5 text-[var(--accent-primary)]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-4">
        <div className="space-y-4 md:space-y-6">
          {actions.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{section.title}</h4>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item, itemIndex) => (
                  <Badge
                    key={itemIndex}
                    variant="secondary"
                    className="cursor-pointer hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors"
                    onClick={() => onSearchSelect?.(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardingHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border-[hsl(var(--border))] bg-[var(--bg-secondary)]">
        <CardHeader className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6" />
              Welcome to APO Dashboard!
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">🚀 Getting Started</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Search for careers using the main search bar on the home page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Click on any occupation to get detailed automation potential analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Save analyses, add notes and tags for future reference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Export your findings as CSV or PDF reports</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">📊 Dashboard Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)]">Profile Management</h4>
                  <p className="text-[var(--text-secondary)] mt-1">Update your personal information and view your usage statistics</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)]">Saved Analyses</h4>
                  <p className="text-[var(--text-secondary)] mt-1">Access all your saved career analyses with notes and tags</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)]">Search History</h4>
                  <p className="text-[var(--text-secondary)] mt-1">Revisit your previous searches and results</p>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)]">Settings</h4>
                  <p className="text-[var(--text-secondary)] mt-1">Customize notifications and export preferences</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>• Use specific job titles for more accurate results</li>
                <li>• Compare multiple careers to understand relative automation risks</li>
                <li>• Check the confidence levels in AI predictions</li>
                <li>• Share your analyses with colleagues using the share feature</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TAB_USAGE_KEY = 'dashboard:tabUsage';

function usePersonalizedDefaultTab(fallback: string) {
  const defaultTab = useMemo(() => {
    try {
      const raw = localStorage.getItem(TAB_USAGE_KEY);
      if (!raw) return fallback;
      const usage: Record<string, number> = JSON.parse(raw);
      const sorted = Object.entries(usage).sort(([, a], [, b]) => b - a);
      return sorted[0]?.[0] || fallback;
    } catch { return fallback; }
  }, [fallback]);

  const trackTab = useCallback((tab: string) => {
    try {
      const raw = localStorage.getItem(TAB_USAGE_KEY);
      const usage: Record<string, number> = raw ? JSON.parse(raw) : {};
      usage[tab] = (usage[tab] || 0) + 1;
      localStorage.setItem(TAB_USAGE_KEY, JSON.stringify(usage));
    } catch {}
  }, []);

  return { defaultTab, trackTab };
}

export function EnhancedUserDashboard({ onLoadAnalysis, onSearchSelect }: EnhancedUserDashboardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { defaultTab, trackTab } = usePersonalizedDefaultTab('profile');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <OnboardingHelpModal open={showHelp} onClose={() => setShowHelp(false)} />

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
        <WelcomeBanner />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <QuickStatsCard
            title="Analyses Saved"
            value={12}
            icon={BookOpen}
            trend="+3 this week"
            color="bg-[var(--accent-primary)]"
            index={0}
          />
          <QuickStatsCard
            title="Recent Searches"
            value={8}
            icon={History}
            trend="+2 today"
            color="bg-[var(--accent-success)]"
            index={1}
          />
          <QuickStatsCard
            title="API Credits"
            value={85}
            icon={Activity}
            color="bg-[var(--accent-amber)]"
            index={2}
          />
          <QuickStatsCard
            title="Time Saved"
            value="4.2h"
            icon={Clock}
            color="bg-[var(--accent-info)]"
            index={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={defaultTab} className="w-full" onValueChange={trackTab}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 md:gap-0">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 bg-[var(--bg-tertiary)] border border-[hsl(var(--border))] rounded-xl">
                  <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="analyses" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Analyses</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Usage</span>
                  </TabsTrigger>
                  <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-primary)]/20 data-[state=active]:text-[var(--accent-primary)]">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">System</span>
                  </TabsTrigger>
                </TabsList>

                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10"
                  onClick={() => setShowHelp(true)}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>

              <TabsContent value="profile" className="mt-4 md:mt-6">
                <UserProfilePanel />
              </TabsContent>

              <TabsContent value="analyses" className="mt-4 md:mt-6">
                <SavedAnalysesPanel onLoadAnalysis={onLoadAnalysis} />
              </TabsContent>

              <TabsContent value="history" className="mt-4 md:mt-6">
                <SearchHistoryPanel onSearchSelect={onSearchSelect} />
              </TabsContent>

              <TabsContent value="settings" className="mt-4 md:mt-6">
                <UserSettingsPanel />
              </TabsContent>

              <TabsContent value="usage" className="mt-4 md:mt-6">
                <UsageDashboard />
              </TabsContent>

              <TabsContent value="system" className="mt-4 md:mt-6">
                <SystemAdminPanel />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <QuickActions onSearchSelect={onSearchSelect} />
            <ProgressWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
