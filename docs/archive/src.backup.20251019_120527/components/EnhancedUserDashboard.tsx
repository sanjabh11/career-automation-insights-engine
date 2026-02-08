
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfilePanel } from "./UserProfilePanel";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { SavedAnalysesPanel } from "./SavedAnalysesPanel";
import { SearchHistoryPanel } from "./SearchHistoryPanel";
import { SystemAdminPanel } from "./SystemAdminPanel";
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
  return (
    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 mb-6 shadow-xl rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to APO Dashboard</h2>
            <p className="text-blue-100">
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
  );
}

function QuickStatsCard({ title, value, icon: Icon, trend, color }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}) {
  return (
    <Card className="hover:shadow-2xl shadow-lg transition-shadow duration-200 rounded-2xl border-0">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1">{trend}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className="rounded-2xl shadow-md border-0">
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-4">
        <div className="space-y-4 md:space-y-6">
          {actions.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{section.title}</h4>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item, itemIndex) => (
                  <Badge 
                    key={itemIndex}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
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
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
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
              <h3 className="text-lg font-semibold mb-3">🚀 Getting Started</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Search for careers using the main search bar on the home page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Click on any occupation to get detailed automation potential analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Save analyses, add notes and tags for future reference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Export your findings as CSV or PDF reports</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Dashboard Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Profile Management</h4>
                  <p className="text-gray-600 mt-1">Update your personal information and view your usage statistics</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Saved Analyses</h4>
                  <p className="text-gray-600 mt-1">Access all your saved career analyses with notes and tags</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Search History</h4>
                  <p className="text-gray-600 mt-1">Revisit your previous searches and results</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Settings</h4>
                  <p className="text-gray-600 mt-1">Customize notifications and export preferences</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
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

export function EnhancedUserDashboard({ onLoadAnalysis, onSearchSelect }: EnhancedUserDashboardProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
        <WelcomeBanner />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <QuickStatsCard
            title="Analyses Saved"
            value={12}
            icon={BookOpen}
            trend="+3 this week"
            color="bg-blue-500"
          />
          <QuickStatsCard
            title="Recent Searches"
            value={8}
            icon={History}
            trend="+2 today"
            color="bg-green-500"
          />
          <QuickStatsCard
            title="API Credits"
            value={85}
            icon={Activity}
            color="bg-purple-500"
          />
          <QuickStatsCard
            title="Time Saved"
            value="4.2h"
            icon={Clock}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="profile" className="w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 md:gap-0">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-white border rounded-xl shadow-sm">
                  <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="analyses" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Analyses</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">System</span>
                  </TabsTrigger>
                </TabsList>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 text-blue-600 border-blue-200 hover:bg-blue-50"
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

              <TabsContent value="system" className="mt-4 md:mt-6">
                <SystemAdminPanel />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <QuickActions onSearchSelect={onSearchSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
