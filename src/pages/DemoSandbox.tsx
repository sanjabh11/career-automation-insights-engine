import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  CheckCircle2,
  Search,
  TrendingUp,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_OCCUPATIONS = [
  {
    code: "29-1141.00",
    title: "Registered Nurses",
    description: "Healthcare professional providing patient care",
  },
  {
    code: "13-2051.00",
    title: "Financial Analysts",
    description: "Conduct quantitative analyses of financial information",
  },
  {
    code: "15-1252.00",
    title: "Software Developers",
    description: "Research, design, and develop computer applications",
  },
];

const TOUR_STEPS = [
  {
    id: 1,
    title: "Search & Discovery",
    description: "Find occupations using keyword search or browse by categories",
    icon: Search,
    content: "Our platform offers multiple ways to discover occupations: keyword search, browse by career clusters, job zones, STEM fields, or Bright Outlook careers.",
  },
  {
    id: 2,
    title: "APO Analysis",
    description: "View Automation Potential & Outlook scores with AI-powered insights",
    icon: TrendingUp,
    content: "Each occupation receives an APO score (0-100) indicating automation risk. We analyze tasks using Gemini AI to classify them as Automate, Augment, or Human-only.",
  },
  {
    id: 3,
    title: "Task Categorization",
    description: "See detailed task breakdown with GenAI impact assessment",
    icon: CheckCircle2,
    content: "Tasks are categorized based on automation potential. View which tasks can be automated, which benefit from AI augmentation, and which require human expertise.",
  },
  {
    id: 4,
    title: "Learning Paths & ROI",
    description: "Discover personalized learning recommendations and career ROI",
    icon: BookOpen,
    content: "Get tailored learning paths with courses, certifications, and resources. See projected ROI including salary ranges, job outlook, and skill gap analysis.",
  },
  {
    id: 5,
    title: "Market Intelligence",
    description: "Access real-time job market data and salary insights",
    icon: DollarSign,
    content: "View current job postings, salary trends, employment outlook, and related occupations. All data sourced from O*NET and live market intelligence.",
  },
];

export default function DemoSandbox() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOccupation, setSelectedOccupation] = useState(DEMO_OCCUPATIONS[0]);
  const [tourStarted, setTourStarted] = useState(false);

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    alert("PDF export functionality would generate a comprehensive report including:\n\n• Occupation overview\n• APO analysis\n• Task categorization\n• Learning paths\n• Market intelligence\n• Salary data");
  };

  const handleStartTour = () => {
    setTourStarted(true);
    setCurrentStep(0);
  };

  const handleViewFullAnalysis = () => {
    window.location.href = `/?search=${encodeURIComponent(selectedOccupation.title)}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <PlayCircle className="h-8 w-8 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Demo Sandbox
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Interactive guided tour showcasing our AI-powered career automation insights platform.
        </p>
      </div>

      {/* Occupation Selector */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Select Demo Occupation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_OCCUPATIONS.map((occ) => (
            <Card
              key={occ.code}
              className={`p-4 cursor-pointer transition-all ${
                selectedOccupation.code === occ.code
                  ? "bg-green-50 border-green-500 border-2 shadow-md"
                  : "hover:shadow-md hover:border-gray-300"
              }`}
              onClick={() => setSelectedOccupation(occ)}
            >
              <h4 className="font-semibold text-sm mb-1">{occ.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{occ.description}</p>
              <Badge variant="outline" className="text-xs font-mono">
                {occ.code}
              </Badge>
            </Card>
          ))}
        </div>
      </Card>

      {/* Tour Section */}
      {!tourStarted ? (
        <Card className="p-8 text-center">
          <PlayCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-6">
            Take a guided tour through our platform's key features using {selectedOccupation.title} as an example.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleStartTour} size="lg" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Start Guided Tour
            </Button>
            <Button onClick={handleViewFullAnalysis} variant="outline" size="lg">
              View Full Analysis
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>

          {/* Tour Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {React.createElement(TOUR_STEPS[currentStep].icon, {
                      className: "h-8 w-8 text-green-600 shrink-0",
                    })}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {TOUR_STEPS[currentStep].title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {TOUR_STEPS[currentStep].description}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {TOUR_STEPS[currentStep].content}
                      </p>
                    </div>
                  </div>

                  {/* Example Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Example for: {selectedOccupation.title}
                    </p>
                    <div className="text-sm text-gray-700">
                      {currentStep === 0 && (
                        <div>
                          <p>Search: "{selectedOccupation.title}"</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Results: 1 exact match found
                          </p>
                        </div>
                      )}
                      {currentStep === 1 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>APO Score:</span>
                            <Badge className="bg-yellow-100 text-yellow-800">65/100</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Moderate automation potential with significant augmentation opportunities
                          </div>
                        </div>
                      )}
                      {currentStep === 2 && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Automate:</span>
                            <span className="font-semibold">25% of tasks</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Augment:</span>
                            <span className="font-semibold">50% of tasks</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Human-only:</span>
                            <span className="font-semibold">25% of tasks</span>
                          </div>
                        </div>
                      )}
                      {currentStep === 3 && (
                        <div className="space-y-1 text-xs">
                          <p>• Recommended Courses: 12 available</p>
                          <p>• Certifications: 5 relevant credentials</p>
                          <p>• Estimated Time: 6-12 months</p>
                          <p>• ROI: High (Bright Outlook career)</p>
                        </div>
                      )}
                      {currentStep === 4 && (
                        <div className="space-y-1 text-xs">
                          <p>• Median Salary: $77,600/year</p>
                          <p>• Job Openings: 194,500 annually</p>
                          <p>• Growth Rate: Faster than average</p>
                          <p>• Related Jobs: 15 similar occupations</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={handleViewFullAnalysis} variant="outline">
                  View Full Analysis
                </Button>
              </div>

              {currentStep < TOUR_STEPS.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleViewFullAnalysis} className="gap-2">
                  Finish Tour
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
