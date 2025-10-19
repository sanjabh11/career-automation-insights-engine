
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfilePanel } from "./UserProfilePanel";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { SavedAnalysesPanel } from "./SavedAnalysesPanel";
import { SearchHistoryPanel } from "./SearchHistoryPanel";
import { SystemAdminPanel } from "./SystemAdminPanel";
import { User, Settings, BookOpen, History, Activity, Lightbulb } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface UserDashboardProps {
  onLoadAnalysis?: (analysis: any) => void;
  onSearchSelect?: (searchTerm: string) => void;
}

function OnboardingHelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <button 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl" 
          onClick={onClose} 
          aria-label="Close Overlay"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" /> 
          Welcome!
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          <li>Search careers via the main bar. Click on a result to analyze automation potential.</li>
          <li>Save analyses for later, add tags/notes, and download as CSV or PDF.</li>
          <li>See your usage/capacity on the dashboard (API credits, limits).</li>
          <li>Need support? Click your profile/settings or visit the <span className="underline text-blue-600">Support</span> tab.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          If you need further help or find a bug, contact support before deployment.
        </p>
      </motion.div>
    </motion.div>
  );
}

export function UserDashboard({ onLoadAnalysis, onSearchSelect }: UserDashboardProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <motion.div 
      className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <OnboardingHelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
      
      <motion.div 
        className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your profile, settings, and saved data</p>
        </div>
        <motion.button
          className="inline-flex gap-1 items-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm transition-colors duration-200 w-fit"
          onClick={() => setShowHelp(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Lightbulb className="w-4 h-4" />
          Help
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Tabs defaultValue="profile" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-max sm:min-w-0 bg-white/80 backdrop-blur-sm border border-gray-200/50 p-1">
              <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="analyses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Saved Analyses</span>
                <span className="sm:hidden">Saved</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Search History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">System</span>
                <span className="sm:hidden">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <TabsContent value="profile" className="mt-4 sm:mt-6">
              <UserProfilePanel />
            </TabsContent>

            <TabsContent value="analyses" className="mt-4 sm:mt-6">
              <SavedAnalysesPanel onLoadAnalysis={onLoadAnalysis} />
            </TabsContent>

            <TabsContent value="history" className="mt-4 sm:mt-6">
              <SearchHistoryPanel onSearchSelect={onSearchSelect} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4 sm:mt-6">
              <UserSettingsPanel />
            </TabsContent>

            <TabsContent value="system" className="mt-4 sm:mt-6">
              <SystemAdminPanel />
            </TabsContent>
          </motion.div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
