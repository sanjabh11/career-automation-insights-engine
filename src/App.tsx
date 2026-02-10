
import { Toaster } from "@/components/ui/sonner";
import { useEffect, lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// SecurityHeaders removed (was a no-op; real headers are in netlify.toml + _headers)
import { UpgradePromptProvider } from "@/contexts/UpgradePromptContext";
import { WhopAppProvider } from "@/contexts/WhopAppContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
// Eagerly loaded (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GlobalShortcuts from "./components/GlobalShortcuts";
import { AIAssistant } from "./components/assistant/AIAssistant";

// Lazy-loaded pages (code-split)
const GapAnalysis = lazy(() => import("./pages/GapAnalysis"));
const UserDashboardPage = lazy(() => import("./pages/UserDashboardPage"));
const SharedAnalysisPage = lazy(() => import("./pages/SharedAnalysisPage"));
const AIImpactPage = lazy(() => import("./pages/AIImpactPage"));
const AIImpactPlannerPage = lazy(() => import("./pages/AIImpactPlannerPage"));
const CareerPlanningPage = lazy(() => import("./pages/CareerPlanningPage"));
const CrosswalkPage = lazy(() => import("./pages/CrosswalkPage"));
const BrowseBrightOutlook = lazy(() => import("./pages/BrowseBrightOutlook"));
const BrowseSTEM = lazy(() => import("./pages/BrowseSTEM"));
const BrowseJobZones = lazy(() => import("./pages/BrowseJobZones"));
const OccupationDetailPage = lazy(() => import("./pages/OccupationDetailPage"));
const JobZoneLaddersPage = lazy(() => import("./pages/JobZoneLaddersPage"));
const ImpactDashboard = lazy(() => import("./pages/ImpactDashboard"));
const ValidationCenter = lazy(() => import("./pages/ValidationCenter"));
const VeteransPage = lazy(() => import("./pages/VeteransPage"));
const TechSkillsPage = lazy(() => import("./pages/TechSkillsPage"));
const WorkDimensionsPage = lazy(() => import("./pages/WorkDimensionsPage"));
const DemoSandbox = lazy(() => import("./pages/DemoSandbox"));
const OutcomesPage = lazy(() => import("./pages/OutcomesPage"));
const ValidationPage = lazy(() => import("./pages/ValidationPage"));
const ValidationMethodsPage = lazy(() => import("./pages/ValidationMethodsPage"));
const QualityPage = lazy(() => import("./pages/QualityPage"));
const ResponsibleAIPage = lazy(() => import("./pages/ResponsibleAIPage"));
const IndustryDashboardPage = lazy(() => import("./pages/IndustryDashboardPage"));
const SkillsBuilderPage = lazy(() => import("./pages/SkillsBuilderPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const SEOComparisonPage = lazy(() => import("./pages/SEOComparisonPage"));
const IndustrySEOPage = lazy(() => import("./pages/IndustrySEOPage"));
const SampleReportPage = lazy(() => import("./pages/SampleReportPage"));
const TaskSearchPage = lazy(() => import("./pages/TaskSearchPage"));
const Test = lazy(() => import("./pages/Test"));
const EconImporter = lazy(() => import("./pages/EconImporter"));
const EconomicsBrowser = lazy(() => import("./pages/EconomicsBrowser"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const WorkshopBookingPage = lazy(() => import("./pages/WorkshopBookingPage"));
const BootcampDashboardPage = lazy(() => import("./pages/BootcampDashboardPage"));
const EnterpriseTeamDashboard = lazy(() => import("./pages/EnterpriseTeamDashboard"));
const SkillAdjacencyGraph = lazy(() => import("./components/SkillAdjacencyGraph"));
const BridgeRolePathway = lazy(() => import("./components/BridgeRolePathway"));
const ResumeAnalyzer = lazy(() => import("./components/ResumeAnalyzer"));
const CounselorReportGenerator = lazy(() => import("./components/CounselorReportGenerator"));
const AutomationRiskLandingPage = lazy(() => import("./pages/AutomationRiskLandingPage"));
const ForCoachesPage = lazy(() => import("./pages/ForCoachesPage"));
const WhopExperiencePage = lazy(() => import("./pages/whop/ExperiencePage"));
const WhopDashboardPage = lazy(() => import("./pages/whop/DashboardPage"));
const WhopDiscoverPage = lazy(() => import("./pages/whop/DiscoverPage"));

const queryClient = new QueryClient();

// Shared Suspense wrapper for all lazy-loaded routes
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

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
    } catch { }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Security headers handled by netlify.toml + public/_headers */}
        <Toaster />


        {/* Atmospheric Background */}
        <div className="atmospheric-bg" aria-hidden="true">
          <div className="grid-overlay"></div>
          <div className="noise-texture"></div>
        </div>

        <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <WhopAppProvider>
            <UpgradePromptProvider>
              <GlobalShortcuts />
              <AIAssistant />
              <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/test" element={<Test />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<UserDashboardPage />} />
                <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/usage" element={<Navigate to="/dashboard" replace />} />
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
                <Route path="/validation-center" element={<Navigate to="/validation/center" replace />} />
                <Route path="/quality" element={<QualityPage />} />
                <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
                <Route path="/industry" element={<IndustryDashboardPage />} />
                <Route path="/impact" element={<ImpactDashboard />} />
                <Route path="/impact-dashboard" element={<Navigate to="/impact" replace />} />
                <Route path="/skills-builder" element={<SkillsBuilderPage />} />
                <Route path="/operations" element={<OperationsPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/econ-importer" element={<EconImporter />} />
                <Route path="/economics" element={<EconomicsBrowser />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/workshops" element={<WorkshopBookingPage />} />
                <Route path="/contact-sales" element={<Navigate to="/workshops" replace />} />
                <Route path="/bootcamp-dashboard" element={<BootcampDashboardPage />} />
                <Route path="/enterprise-dashboard" element={<EnterpriseTeamDashboard orgId="demo" />} />
                <Route path="/browse/bright-outlook" element={<BrowseBrightOutlook />} />
                <Route path="/browse/stem" element={<BrowseSTEM />} />
                <Route path="/browse/job-zones" element={<BrowseJobZones />} />
                <Route path="/occupation/:code" element={<OccupationDetailPage />} />
                <Route path="/ladders" element={<JobZoneLaddersPage />} />
                <Route path="/job-zone-ladders" element={<Navigate to="/ladders" replace />} />
                <Route path="/job-zone-ladder" element={<Navigate to="/ladders" replace />} />
                <Route path="/gap-analysis" element={<GapAnalysis />} />

                {/* Monetization V1 Features (Dec 13, 2025) */}
                <Route path="/tools/skill-adjacency" element={<SkillAdjacencyGraph />} />
                <Route path="/tools/bridge-roles" element={<BridgeRolePathway />} />
                <Route path="/tools/resume-analyzer" element={<ResumeAnalyzer />} />
                <Route path="/tools/counselor-reports" element={<CounselorReportGenerator />} />
                <Route path="/counselor-reports" element={<Navigate to="/tools/counselor-reports" replace />} />

                {/* Monetization V2: SEO Landing Pages (Dec 24, 2024) */}
                <Route path="/automation-risk/:occupation" element={<AutomationRiskLandingPage />} />
                <Route path="/compare/:slugs" element={<SEOComparisonPage />} />
                <Route path="/automation-risk/industry" element={<IndustrySEOPage />} />
                <Route path="/automation-risk/industry/:industry" element={<IndustrySEOPage />} />

                <Route path="/sample-report" element={<SampleReportPage />} />

                {/* B2B Landing Pages */}
                <Route path="/for-coaches" element={<ForCoachesPage />} />

                {/* Whop Embedded App Routes */}

                <Route path="/whop/experience" element={<WhopExperiencePage />} />
                <Route path="/whop/dashboard" element={<WhopDashboardPage />} />
                <Route path="/whop/discover" element={<WhopDiscoverPage />} />

                {/* Whop OAuth callback */}
                <Route path="/auth/whop/callback" element={<Auth />} />
              </Routes>
              </Suspense>
            </UpgradePromptProvider>
          </WhopAppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
