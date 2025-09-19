
import { Toaster } from "@/components/ui/sonner";
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
import NotFound from "./pages/NotFound";
import ComparePage from "./pages/ComparePage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/shared/:shareToken" element={<SharedAnalysisPage />} />
            <Route path="/ai-impact" element={<AIImpactPage />} />
            <Route path="/ai-impact-planner" element={<AIImpactPlannerPage />} />
            <Route path="/career-planning" element={<CareerPlanningPage />} />
            <Route path="/crosswalk" element={<CrosswalkPage />} />
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
