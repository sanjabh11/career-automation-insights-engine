
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SecurityHeaders } from "@/components/SecurityHeaders";
import Index from "./pages/Index";
import GapAnalysis from "./pages/GapAnalysis";
import Auth from "./pages/Auth";
import UserDashboardPage from "./pages/UserDashboardPage";
import SharedAnalysisPage from "./pages/SharedAnalysisPage";
import AIImpactPage from "./pages/AIImpactPage";
import AIImpactPlannerPage from "./pages/AIImpactPlannerPage";
import CareerPlanningPage from "./pages/CareerPlanningPage";
import CrosswalkPage from "./pages/CrosswalkPage";
import BrowseBrightOutlook from "./pages/BrowseBrightOutlook";
import BrowseSTEM from "./pages/BrowseSTEM";
import BrowseJobZones from "./pages/BrowseJobZones";
import OccupationDetailPage from "./pages/OccupationDetailPage";
import JobZoneLaddersPage from "./pages/JobZoneLaddersPage";
import ImpactDashboard from "./pages/ImpactDashboard";
import ValidationCenter from "./pages/ValidationCenter";
import VeteransPage from "./pages/VeteransPage";
import TechSkillsPage from "./pages/TechSkillsPage";
import WorkDimensionsPage from "./pages/WorkDimensionsPage";
import DemoSandbox from "./pages/DemoSandbox";
import OutcomesPage from "./pages/OutcomesPage";
import ValidationPage from "./pages/ValidationPage";
import ValidationMethodsPage from "./pages/ValidationMethodsPage";
import QualityPage from "./pages/QualityPage";
import ResponsibleAIPage from "./pages/ResponsibleAIPage";
import IndustryDashboardPage from "./pages/IndustryDashboardPage";
import SkillsBuilderPage from "./pages/SkillsBuilderPage";
import OperationsPage from "./pages/OperationsPage";
import ResourcesPage from "./pages/ResourcesPage";
import HelpPage from "./pages/HelpPage";
import GlobalShortcuts from "./components/GlobalShortcuts";
import { AIAssistant } from "./components/assistant/AIAssistant";
import NotFound from "./pages/NotFound";
import ComparePage from "./pages/ComparePage";
import TaskSearchPage from "./pages/TaskSearchPage";
import Test from "./pages/Test";
import EconImporter from "./pages/EconImporter";
import EconomicsBrowser from "./pages/EconomicsBrowser";
import MarketplacePage from "./pages/MarketplacePage";
import AgentDashboardPage from "./pages/AgentDashboardPage";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = {
        utm_source: params.get("utm_source") || undefined,
        utm_medium: params.get("utm_medium") || undefined,
        utm_campaign: params.get("utm_campaign") || undefined,
        utm_term: params.get("utm_term") || undefined,
        utm_content: params.get("utm_content") || undefined,
      } as Record<string, string | undefined>;
      const hasAny = Object.values(utm).some(Boolean);
      if (hasAny) {
        sessionStorage.setItem("utm_params", JSON.stringify(utm));
      }
    } catch {}
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <BrowserRouter>
          <GlobalShortcuts />
          <AIAssistant />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<Test />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/user-dashboard" element={<UserDashboardPage />} />
            <Route path="/shared/:shareToken" element={<SharedAnalysisPage />} />
            <Route path="/ai-impact" element={<AIImpactPage />} />
            <Route path="/ai-impact-planner" element={<AIImpactPlannerPage />} />
            <Route path="/career-planning" element={<CareerPlanningPage />} />
            <Route path="/crosswalk" element={<CrosswalkPage />} />
            <Route path="/veterans" element={<VeteransPage />} />
            <Route path="/tech-skills" element={<TechSkillsPage />} />
            <Route path="/work-dimensions" element={<WorkDimensionsPage />} />
            <Route path="/task-search" element={<TaskSearchPage />} />
            <Route path="/demo" element={<DemoSandbox />} />
            <Route path="/outcomes" element={<OutcomesPage />} />
            <Route path="/validation" element={<ValidationPage />} />
            <Route path="/validation/methods" element={<ValidationMethodsPage />} />
            <Route path="/docs/methods" element={<Navigate to="/validation/methods" replace />} />
            <Route path="/validation/center" element={<ValidationCenter />} />
            <Route path="/validation-center" element={<ValidationCenter />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
            <Route path="/industry" element={<IndustryDashboardPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/impact-dashboard" element={<ImpactDashboard />} />
            <Route path="/skills-builder" element={<SkillsBuilderPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/econ-importer" element={<EconImporter />} />
            <Route path="/economics" element={<EconomicsBrowser />} />
            <Route path="/browse/bright-outlook" element={<BrowseBrightOutlook />} />
            <Route path="/browse/stem" element={<BrowseSTEM />} />
            <Route path="/browse/job-zones" element={<BrowseJobZones />} />
            <Route path="/occupation/:code" element={<OccupationDetailPage />} />
            <Route path="/ladders" element={<JobZoneLaddersPage />} />
            <Route path="/job-zone-ladders" element={<JobZoneLaddersPage />} />
            <Route path="/job-zone-ladder" element={<JobZoneLaddersPage />} />
            <Route path="/gap-analysis" element={<GapAnalysis />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/agent-dashboard" element={<AgentDashboardPage />} />
            <Route path="/agents" element={<AgentDashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
