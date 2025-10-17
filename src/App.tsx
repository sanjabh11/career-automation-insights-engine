
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import VeteransPage from "./pages/VeteransPage";
import TechSkillsPage from "./pages/TechSkillsPage";
import WorkDimensionsPage from "./pages/WorkDimensionsPage";
import DemoSandbox from "./pages/DemoSandbox";
import OutcomesPage from "./pages/OutcomesPage";
import ValidationPage from "./pages/ValidationPage";
import ValidationMethodsPage from "./pages/ValidationMethodsPage";
import QualityPage from "./pages/QualityPage";
import ResponsibleAIPage from "./pages/ResponsibleAIPage";
import SkillsBuilderPage from "./pages/SkillsBuilderPage";
import OperationsPage from "./pages/OperationsPage";
import ResourcesPage from "./pages/ResourcesPage";
import NotFound from "./pages/NotFound";
import ComparePage from "./pages/ComparePage";
import TaskSearchPage from "./pages/TaskSearchPage";
import Test from "./pages/Test";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<Test />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
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
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
            <Route path="/skills-builder" element={<SkillsBuilderPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/browse/bright-outlook" element={<BrowseBrightOutlook />} />
            <Route path="/browse/stem" element={<BrowseSTEM />} />
            <Route path="/gap-analysis" element={<GapAnalysis />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
